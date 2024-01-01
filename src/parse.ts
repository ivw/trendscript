import { ANTLRErrorListener, CharStreams, CommonTokenStream, TerminalNode } from "antlr4ng"
import { TrendScriptLexer } from "../generated/TrendScriptLexer"
import {
  ActionBlockContext,
  ActionContext,
  BlockActionContext,
  BooleanExpressionContext,
  ConditionalActionContext,
  DateDeclarationContext,
  DatePatternContext,
  DatePatternExpressionContext,
  DatePatternPartContext,
  DeclarationContext,
  LiteralNumberExpressionContext,
  NumberExpressionContext,
  OperatorActionContext,
  OperatorNumberExpressionContext,
  ReferenceNumberExpressionContext,
  RuleDeclarationContext,
  TrendScriptParser,
  VarDeclarationContext,
} from "../generated/TrendScriptParser"
import { GraphData, MutateState, State, getGraphData } from "./evaluate"
import { DatePattern, createDatePattern, emptyDatePattern } from "./utils/dateUtils"

export type ParseResult = {
  initialState: State
  dates: Record<string, DatePattern>
  rules: Array<MutateState>
  log: Log
}

export function getGraphDataFromParseResult(
  parseResult: ParseResult,
  startDate: Date,
  nrDays: number,
): GraphData {
  const mutateState: MutateState = (state, date, day) => {
    parseResult.rules.forEach((rule) => rule(state, date, day))
  }
  return getGraphData(
    parseResult.initialState,
    startDate,
    nrDays,
    mutateState,
    Object.keys(parseResult.initialState),
  )
}

export type Msg = {
  line: number
  charPositionInLine: number
  msg: string
}

export type Log = Array<Msg>

function msgFromNode(node: TerminalNode, msg: string): Msg {
  return { line: node.symbol.line, charPositionInLine: node.symbol.column + 1, msg }
}

type Action = (state: State) => void

const emptyAction: Action = () => {}

type NumberExpression = (state: State) => number

type DatePatternExpression = (dates: Record<string, DatePattern>) => DatePattern

type BooleanExpression = (state: State) => boolean

export function parse(input: string): ParseResult {
  const inputStream = CharStreams.fromString(input)

  const log: Log = []
  const errorHandler: ANTLRErrorListener = {
    syntaxError: (_recognizer, _offendingSymbol, line, charPositionInLine, msg) => {
      log.push({ line, charPositionInLine: charPositionInLine + 1, msg })
    },
    reportAmbiguity: (_recognizer, _dfa, startIndex, stopIndex) => {
      console.error("Ambiguity", startIndex, stopIndex)
    },
    reportAttemptingFullContext: (_recognizer, _dfa, startIndex, stopIndex) => {
      console.error("AttemptingFullContext", startIndex, stopIndex)
    },
    reportContextSensitivity: (_recognizer, _dfa, startIndex, stopIndex) => {
      console.error("ContextSensitivity", startIndex, stopIndex)
    },
  }

  const lexer = new TrendScriptLexer(inputStream)
  lexer.removeErrorListeners()
  lexer.addErrorListener(errorHandler)
  const tokenStream = new CommonTokenStream(lexer)
  const parser = new TrendScriptParser(tokenStream)
  parser.removeErrorListeners()
  parser.addErrorListener(errorHandler)
  const tree = parser.program()

  const result: ParseResult = {
    initialState: {},
    dates: {},
    rules: [],
    log,
  }
  if (log.length === 0) {
    tree
      .declarationList()
      .declaration()
      .forEach((it) => parseDeclaration(it, result))
  }
  return result
}

function parseDeclaration(ctx: DeclarationContext, result: ParseResult) {
  if (ctx instanceof VarDeclarationContext) {
    const numberExpression = parseNumberExpression(ctx.numberExpression(), result)
    const name = ctx.Name().getText()
    if (name in result.initialState) {
      result.log.push(msgFromNode(ctx.Name(), `var \`${name}\` already exists`))
    }
    result.initialState[ctx.Name().getText()] = numberExpression(result.initialState)
  } else if (ctx instanceof DateDeclarationContext) {
    const name = ctx.Name().getText()
    if (name in result.dates) {
      result.log.push(msgFromNode(ctx.Name(), `date \`${name}\` already exists`))
    }
    result.dates[name] = parseDatePattern(ctx.datePattern())
  } else if (ctx instanceof RuleDeclarationContext) {
    const datePatternExpression = parseDatePatternExpression(ctx.datePatternExpression(), result)
    const action = parseAction(ctx.action(), result)
    let datePattern: DatePattern
    result.rules.push((state, date) => {
      if (!datePattern) {
        datePattern = datePatternExpression(result.dates)
      }
      if (datePattern(date)) {
        action(state)
      }
    })
  }
}

function parseAction(ctx: ActionContext, result: ParseResult): Action {
  if (ctx instanceof OperatorActionContext) {
    return parseOperatorAction(ctx, result)
  } else if (ctx instanceof ConditionalActionContext) {
    return parseConditionalAction(ctx, result)
  } else if (ctx instanceof BlockActionContext) {
    return parseActionBlock(ctx.actionBlock(), result)
  } else {
    throw new Error()
  }
}

function parseOperatorAction(ctx: OperatorActionContext, result: ParseResult): Action {
  const name = ctx.Name().getText()
  if (!(name in result.initialState)) {
    result.log.push(msgFromNode(ctx.Name(), `var \`${name}\` not found`))
    return emptyAction
  }
  const operator = ctx.actionOperator().getText()
  const numberExpression = parseNumberExpression(ctx.numberExpression(), result)

  return (state) => {
    const number = numberExpression(state)
    switch (operator) {
      case "=": {
        state[name] = number
        break
      }
      case "+=": {
        state[name] += number
        break
      }
      case "-=": {
        state[name] -= number
        break
      }
      case "*=": {
        state[name] *= number
        break
      }
      case "/=": {
        state[name] /= number
        break
      }
    }
  }
}
function parseConditionalAction(ctx: ConditionalActionContext, result: ParseResult): Action {
  const booleanExpression = parseBooleanExpression(ctx.booleanExpression(), result)
  const ifAction = parseActionBlock(ctx._ifBlock!, result)
  const elseAction = ctx._elseBlock ? parseActionBlock(ctx._elseBlock, result) : null
  return (state) => {
    const b = booleanExpression(state)
    if (b) {
      ifAction(state)
    } else if (elseAction) {
      elseAction(state)
    }
  }
}

function parseActionBlock(ctx: ActionBlockContext, result: ParseResult): Action {
  const actions = ctx.action().map((it) => parseAction(it, result))
  if (actions.length === 0) {
    return emptyAction
  }
  if (actions.length === 1) {
    return actions[0]
  }
  return (state) => {
    actions.forEach((action) => action(state))
  }
}

function parseNumberExpression(
  ctx: NumberExpressionContext,
  result: ParseResult,
): NumberExpression {
  if (ctx instanceof LiteralNumberExpressionContext) {
    const number = Number.parseFloat(ctx.getText())
    return () => number
  } else if (ctx instanceof ReferenceNumberExpressionContext) {
    const name = ctx.Name().getText()
    if (!(name in result.initialState)) {
      result.log.push(msgFromNode(ctx.Name(), `var \`${name}\` not found`))
      return () => NaN
    }
    return (state) => state[name]
  } else if (ctx instanceof OperatorNumberExpressionContext) {
    return parseOperatorNumberExpression(ctx, result)
  } else {
    throw new Error()
  }
}

function parseOperatorNumberExpression(
  ctx: OperatorNumberExpressionContext,
  result: ParseResult,
): NumberExpression {
  const aExpression = parseNumberExpression(ctx.numberExpression(0)!, result)
  const bExpression = parseNumberExpression(ctx.numberExpression(1)!, result)
  const operator = ctx.numberOperator().getText()
  return (state) => {
    const a = aExpression(state)
    const b = bExpression(state)
    switch (operator) {
      case "+": {
        return a + b
      }
      case "-": {
        return a - b
      }
      case "*": {
        return a * b
      }
      case "/": {
        return a / b
      }
      default: {
        throw new Error()
      }
    }
  }
}

function parseDatePatternExpression(
  ctx: DatePatternExpressionContext,
  result: ParseResult,
): DatePatternExpression {
  const datePatternCtx = ctx.datePattern()
  if (datePatternCtx) {
    const datePattern = parseDatePattern(datePatternCtx)
    return () => datePattern
  } else {
    const name: string = ctx.Name()!.getText()
    if (!(name in result.dates)) {
      result.log.push(msgFromNode(ctx.Name()!, `date \`${name}\` not found`))
      return () => emptyDatePattern
    }
    return (dates) => dates[name]
  }
}

function parseDatePattern(ctx: DatePatternContext): DatePattern {
  const year = parseDatePatternPart(ctx.datePatternPart(0)!)
  const month = parseDatePatternPart(ctx.datePatternPart(1)!)
  const day = parseDatePatternPart(ctx.datePatternPart(2)!)
  return createDatePattern(year, month, day)
}

function parseDatePatternPart(ctx: DatePatternPartContext): number | null {
  if (!ctx.DecimalLiteral()) return null
  return Number.parseFloat(ctx.getText())
}

function parseBooleanExpression(
  ctx: BooleanExpressionContext,
  result: ParseResult,
): BooleanExpression {
  const aExpression = parseNumberExpression(ctx.numberExpression(0)!, result)
  const bExpression = parseNumberExpression(ctx.numberExpression(1)!, result)
  const operator = ctx.comparisonOperator().getText()
  return (state) => {
    const a = aExpression(state)
    const b = bExpression(state)
    switch (operator) {
      case "==": {
        return a == b
      }
      case ">": {
        return a > b
      }
      case "<": {
        return a < b
      }
      case ">=": {
        return a >= b
      }
      case "<=": {
        return a <= b
      }
      default: {
        throw new Error()
      }
    }
  }
}
