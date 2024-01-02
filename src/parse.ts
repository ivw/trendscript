import { ANTLRErrorListener, CharStreams, CommonTokenStream, TerminalNode } from "antlr4ng"
import { startOfDay } from "date-fns"
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
  OptionsBlockContext,
  ReferenceNumberExpressionContext,
  RuleDeclarationContext,
  TrendScriptParser,
  VarDeclarationContext,
} from "../generated/TrendScriptParser"
import {
  GraphData,
  GraphOptions,
  MutateState,
  State,
  StateKeyProps,
  getGraphData,
} from "./evaluate"
import { DatePattern, createDatePattern, emptyDatePattern } from "./utils/dateUtils"

export type ParseContext = {
  stateKeysProps: Array<StateKeyProps>
  initialState: State
  dates: Record<string, DatePattern>
  rules: Array<MutateState>
  log: Log
}

export type Log = Array<Msg>

export type Msg = {
  line: number
  charPositionInLine: number
  msg: string
}

function msgFromNode(node: TerminalNode, msg: string): Msg {
  return { line: node.symbol.line, charPositionInLine: node.symbol.column + 1, msg }
}

type Action = (state: State) => void

const emptyAction: Action = () => {}

type NumberExpression = (state: State) => number

type DatePatternExpression = (dates: Record<string, DatePattern>) => DatePattern

type BooleanExpression = (state: State) => boolean

type RawOptions = Record<string, RawOption>

type RawOption = { value: string | number; node: TerminalNode }

const defaultDuration = 365 * 5

const defaultHeightPx = 200

export function parse(input: string): { log: Log; graphData: GraphData | null } {
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
  const parser = new TrendScriptParser(new CommonTokenStream(lexer))
  parser.removeErrorListeners()
  parser.addErrorListener(errorHandler)
  const tree = parser.program()
  if (log.length > 0) {
    return { log, graphData: null }
  }

  const context: ParseContext = {
    stateKeysProps: [],
    initialState: {},
    dates: {},
    rules: [],
    log,
  }
  tree
    .declarationList()
    .declaration()
    .forEach((it) => parseDeclaration(it, context))

  const optionsBlockCtx = tree.optionsBlock()
  const rawOptions = optionsBlockCtx ? parseOptionsBlock(optionsBlockCtx, context) : {}
  const graphOptions: GraphOptions = {
    startDate: rawOptions.startDate ? new Date(rawOptions.startDate.value) : startOfDay(new Date()),
    nrDays: rawOptions.duration ? parseDuration(rawOptions.duration, log) : defaultDuration,
    heightPx: rawOptions.height ? Number(rawOptions.height.value) : defaultHeightPx,
    stateKeysProps: context.stateKeysProps,
  }
  if (log.length > 0) {
    return { log, graphData: null }
  }
  const mutateState: MutateState = (state, date, day) => {
    context.rules.forEach((rule) => rule(state, date, day))
  }
  const graphData = getGraphData(context.initialState, mutateState, graphOptions)
  return { log, graphData }
}

function parseDeclaration(ctx: DeclarationContext, context: ParseContext) {
  if (ctx instanceof VarDeclarationContext) {
    const numberExpression = parseNumberExpression(ctx.numberExpression(), context)
    const name = ctx.Name().getText()
    const optionsBlockCtx = ctx.optionsBlock()
    const options = optionsBlockCtx ? parseOptionsBlock(optionsBlockCtx, context) : {}
    if (name in context.initialState) {
      context.log.push(msgFromNode(ctx.Name(), `var \`${name}\` already exists`))
    } else {
      context.initialState[name] = numberExpression(context.initialState)
      if (options.color?.value !== "hidden") {
        context.stateKeysProps.push({
          key: name,
          label: options.label ? String(options.label.value) : undefined,
          color: options.color ? String(options.color.value) : undefined,
        })
      }
    }
  } else if (ctx instanceof DateDeclarationContext) {
    const name = ctx.Name().getText()
    if (name in context.dates) {
      context.log.push(msgFromNode(ctx.Name(), `date \`${name}\` already exists`))
    }
    context.dates[name] = parseDatePattern(ctx.datePattern())
  } else if (ctx instanceof RuleDeclarationContext) {
    const datePatternExpression = parseDatePatternExpression(ctx.datePatternExpression(), context)
    const action = parseAction(ctx.action(), context)
    let datePattern: DatePattern
    context.rules.push((state, date) => {
      if (!datePattern) {
        datePattern = datePatternExpression(context.dates)
      }
      if (datePattern(date)) {
        action(state)
      }
    })
  }
}

function parseAction(ctx: ActionContext, context: ParseContext): Action {
  if (ctx instanceof OperatorActionContext) {
    return parseOperatorAction(ctx, context)
  } else if (ctx instanceof ConditionalActionContext) {
    return parseConditionalAction(ctx, context)
  } else if (ctx instanceof BlockActionContext) {
    return parseActionBlock(ctx.actionBlock(), context)
  } else {
    throw new Error()
  }
}

function parseOperatorAction(ctx: OperatorActionContext, context: ParseContext): Action {
  const name = ctx.Name().getText()
  if (!(name in context.initialState)) {
    context.log.push(msgFromNode(ctx.Name(), `var \`${name}\` not found`))
    return emptyAction
  }
  const operator = ctx.actionOperator().getText()
  const numberExpression = parseNumberExpression(ctx.numberExpression(), context)

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
function parseConditionalAction(ctx: ConditionalActionContext, context: ParseContext): Action {
  const booleanExpression = parseBooleanExpression(ctx.booleanExpression(), context)
  const ifAction = parseActionBlock(ctx._ifBlock!, context)
  const elseAction = ctx._elseBlock ? parseActionBlock(ctx._elseBlock, context) : null
  return (state) => {
    const b = booleanExpression(state)
    if (b) {
      ifAction(state)
    } else if (elseAction) {
      elseAction(state)
    }
  }
}

function parseActionBlock(ctx: ActionBlockContext, context: ParseContext): Action {
  const actions = ctx.action().map((it) => parseAction(it, context))
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
  context: ParseContext,
): NumberExpression {
  if (ctx instanceof LiteralNumberExpressionContext) {
    const number = Number.parseFloat(ctx.getText())
    return () => number
  } else if (ctx instanceof ReferenceNumberExpressionContext) {
    const name = ctx.Name().getText()
    if (!(name in context.initialState)) {
      context.log.push(msgFromNode(ctx.Name(), `var \`${name}\` not found`))
      return () => NaN
    }
    return (state) => state[name]
  } else if (ctx instanceof OperatorNumberExpressionContext) {
    return parseOperatorNumberExpression(ctx, context)
  } else {
    throw new Error()
  }
}

function parseOperatorNumberExpression(
  ctx: OperatorNumberExpressionContext,
  context: ParseContext,
): NumberExpression {
  const aExpression = parseNumberExpression(ctx.numberExpression(0)!, context)
  const bExpression = parseNumberExpression(ctx.numberExpression(1)!, context)
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
  context: ParseContext,
): DatePatternExpression {
  const datePatternCtx = ctx.datePattern()
  if (datePatternCtx) {
    const datePattern = parseDatePattern(datePatternCtx)
    return () => datePattern
  } else {
    const name: string = ctx.Name()!.getText()
    if (!(name in context.dates)) {
      context.log.push(msgFromNode(ctx.Name()!, `date \`${name}\` not found`))
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
  context: ParseContext,
): BooleanExpression {
  const aExpression = parseNumberExpression(ctx.numberExpression(0)!, context)
  const bExpression = parseNumberExpression(ctx.numberExpression(1)!, context)
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

function parseStringLiteral(node: TerminalNode): string {
  return node.getText().slice(1, -1)
}

function parseOptionsBlock(ctx: OptionsBlockContext, context: ParseContext): RawOptions {
  const options: RawOptions = {}
  ctx.option().forEach((optionCtx) => {
    const name = optionCtx.Name().getText()
    const numberExpressionCtx = optionCtx.numberExpression()
    options[name] = {
      value: numberExpressionCtx
        ? parseNumberExpression(numberExpressionCtx, context)(context.initialState)
        : parseStringLiteral(optionCtx.StringLiteral()!),
      node: optionCtx.Name(),
    }
  })
  return options
}

function parseDuration(rawOption: RawOption, log: Log): number {
  const durationString = String(rawOption.value)
  const lastChar = durationString.slice(-1)
  const otherChars = durationString.slice(0, -1)
  const num = Number(otherChars)
  if (num > 0) {
    switch (lastChar) {
      case "d":
        return num
      case "w":
        return num * 7
      case "m":
        return num * 31
      case "y":
        return num * 365
      default:
    }
  }
  log.push(msgFromNode(rawOption.node, `duration should be formatted like \`123d\` (d/w/m/y)`))
  return defaultDuration
}
