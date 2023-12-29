import { ANTLRErrorListener, CharStreams, CommonTokenStream, TerminalNode } from "antlr4ng"
import { TrendScriptLexer } from "../generated/TrendScriptLexer.js"
import {
  ActionContext,
  DateDeclarationContext,
  DatePatternExpressionContext,
  DatePatternContext,
  DatePatternPartContext,
  DeclarationContext,
  LiteralNumberExpressionContext,
  NumberExpressionContext,
  ReferenceNumberExpressionContext,
  RuleDeclarationContext,
  TrendScriptParser,
  VarDeclarationContext,
  OperatorNumberExpressionContext,
  OperatorActionContext,
  ConditionalActionContext,
  BooleanExpressionContext,
} from "../generated/TrendScriptParser.js"
import { MutateState, State } from "./evaluate.js"
import { DatePattern, createDatePattern, emptyDatePattern } from "./utils/dateUtils.js"

export type ParseResult = {
  initialState: State
  dates: Record<string, DatePattern>
  rules: Array<MutateState>
  log: Log
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
      result.log.push(msgFromNode(ctx.Name(), "name already exists"))
    }
    result.initialState[ctx.Name().getText()] = numberExpression(result.initialState)
  } else if (ctx instanceof DateDeclarationContext) {
    const name = ctx.Name().getText()
    if (name in result.dates) {
      result.log.push(msgFromNode(ctx.Name(), "name already exists"))
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

function parseAction(ctx: ActionContext, result: ParseResult): (state: State) => void {
  if (ctx instanceof OperatorActionContext) {
    return parseOperatorAction(ctx, result)
  } else if (ctx instanceof ConditionalActionContext) {
    return parseConditionalAction(ctx, result)
  } else {
    throw new Error()
  }
}

function parseOperatorAction(
  ctx: OperatorActionContext,
  result: ParseResult,
): (state: State) => void {
  const name = ctx.Name().getText()
  if (!(name in result.initialState)) {
    result.log.push(msgFromNode(ctx.Name(), "name not found"))
    return () => {}
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
function parseConditionalAction(
  ctx: ConditionalActionContext,
  result: ParseResult,
): (state: State) => void {
  const booleanExpression = parseBooleanExpression(ctx.booleanExpression(), result)
  const ifAction = parseAction(ctx._ifAction!, result)
  const elseAction = ctx._elseAction ? parseAction(ctx._elseAction, result) : null
  return (state) => {
    const b = booleanExpression(state)
    if (b) {
      ifAction(state)
    } else if (elseAction) {
      elseAction(state)
    }
  }
}

function parseNumberExpression(
  ctx: NumberExpressionContext,
  result: ParseResult,
): (state: State) => number {
  if (ctx instanceof LiteralNumberExpressionContext) {
    const number = Number.parseFloat(ctx.getText())
    return () => number
  } else if (ctx instanceof ReferenceNumberExpressionContext) {
    const name = ctx.Name().getText()
    if (!(name in result.initialState)) {
      result.log.push(msgFromNode(ctx.Name(), "name not found"))
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
): (state: State) => number {
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
): (dates: Record<string, DatePattern>) => DatePattern {
  const datePatternCtx = ctx.datePattern()
  if (datePatternCtx) {
    const datePattern = parseDatePattern(datePatternCtx)
    return () => datePattern
  } else {
    const name: string = ctx.Name()!.getText()
    if (!(name in result.dates)) {
      result.log.push(msgFromNode(ctx.Name()!, "name not found"))
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
): (state: State) => boolean {
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
