import { CharStreams, CommonTokenStream, TerminalNode } from "antlr4ng"
import { TrendScriptLexer } from "../generated/TrendScriptLexer.js"
import {
  ActionContext,
  DateDeclarationContext,
  DatePatternContext,
  DatePatternPartContext,
  DeclarationContext,
  LiteralNumberExpressionContext,
  NumberExpressionContext,
  ReferenceNumberExpressionContext,
  RuleDeclarationContext,
  TrendScriptParser,
  VarDeclarationContext,
} from "../generated/TrendScriptParser.js"
import { MutateState, State } from "./evaluate.js"
import { DatePattern, createDatePattern } from "./dateUtils.js"

export type ParseResult = {
  initialState: State
  dates: Record<string, DatePattern>
  rules: Array<MutateState>
}

export function parse(input: string): ParseResult {
  const inputStream = CharStreams.fromString(input)
  const lexer = new TrendScriptLexer(inputStream)
  const tokenStream = new CommonTokenStream(lexer)
  const parser = new TrendScriptParser(tokenStream)
  const tree = parser.program()

  const result: ParseResult = {
    initialState: {},
    dates: {},
    rules: [],
  }
  tree
    .declarationList()
    .declaration()
    .forEach((it) => parseDeclaration(it, result))
  return result
}

function parseDeclaration(ctx: DeclarationContext, result: ParseResult) {
  if (ctx instanceof VarDeclarationContext) {
    const numberExpression = parseNumberExpression(ctx.numberExpression())
    result.initialState[ctx.Name().getText()] = numberExpression(result.initialState)
  } else if (ctx instanceof DateDeclarationContext) {
    result.dates[ctx.Name().getText()] = parseDatePattern(ctx.datePattern())
  } else if (ctx instanceof RuleDeclarationContext) {
    let datePattern: DatePattern
    const action = parseAction(ctx.action())
    result.rules.push((state, date) => {
      if (!datePattern) {
        const datePatternCtx = ctx.datePattern()
        if (datePatternCtx) {
          datePattern = parseDatePattern(datePatternCtx)
        } else {
          const name: string = ctx.Name()!.getText()
          datePattern = result.dates[name]
        }
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
  } else {
    throw new Error()
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
