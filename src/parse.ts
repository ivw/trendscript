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
} from "../generated/TrendScriptParser.js"
import { MutateState, State } from "./evaluate.js"
import { DatePattern, createDatePattern } from "./dateUtils.js"

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

export function parse(input: string): ParseResult {
  const inputStream = CharStreams.fromString(input)

  const log: Log = []
  const errorHandler: ANTLRErrorListener = {
    syntaxError: (_recognizer, _offendingSymbol, line, charPositionInLine, msg) => {
      log.push({ line, charPositionInLine: charPositionInLine + 1, msg })
    },
    reportAmbiguity: () => {
      console.error("Ambiguity")
    },
    reportAttemptingFullContext: () => {
      console.error("AttemptingFullContext")
    },
    reportContextSensitivity: () => {
      console.error("ContextSensitivity")
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
    const numberExpression = parseNumberExpression(ctx.numberExpression())
    result.initialState[ctx.Name().getText()] = numberExpression(result.initialState)
  } else if (ctx instanceof DateDeclarationContext) {
    result.dates[ctx.Name().getText()] = parseDatePattern(ctx.datePattern())
  } else if (ctx instanceof RuleDeclarationContext) {
    const datePatternExpression = parseDatePatternExpression(ctx.datePatternExpression())
    const action = parseAction(ctx.action())
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

function parseAction(ctx: ActionContext): (state: State) => void {
  const name = ctx.Name()!.getText()
  const operator = ctx.actionOperator().getText()
  const numberExpression = parseNumberExpression(ctx.numberExpression())

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

function parseNumberExpression(ctx: NumberExpressionContext): (state: State) => number {
  if (ctx instanceof LiteralNumberExpressionContext) {
    const number = Number.parseFloat(ctx.getText())
    return () => number
  } else if (ctx instanceof ReferenceNumberExpressionContext) {
    const name = ctx.Name().getText()
    return (state) => state[name]
  } else if (ctx instanceof OperatorNumberExpressionContext) {
    const aExpression = parseNumberExpression(ctx.numberExpression(0)!)
    const bExpression = parseNumberExpression(ctx.numberExpression(1)!)
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
  } else {
    throw new Error()
  }
}

function parseDatePatternExpression(
  ctx: DatePatternExpressionContext,
): (dates: Record<string, DatePattern>) => DatePattern {
  const datePatternCtx = ctx.datePattern()
  if (datePatternCtx) {
    const datePattern = parseDatePattern(datePatternCtx)
    return () => datePattern
  } else {
    const name: string = ctx.Name()!.getText()
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
