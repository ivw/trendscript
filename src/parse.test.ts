import { describe, expect, test } from "vitest"
import { GraphData } from "./evaluate"
import { Log, getGraphDataFromParseResult, parse } from "./parse"

// Feb 02 2000
const startDate = new Date(2000, 1, 2)

const nrDays = 3

describe("parse", () => {
  test("success", () => {
    const code = `
      var a = 1

      date b = */*/*

      at b, a += 1
    `

    const parseResult = parse(code)
    const graphData = getGraphDataFromParseResult(parseResult, startDate, nrDays)
    const expected: GraphData = {
      data: [[2, 3, 4]],
      stateKeysProps: [{ key: "a", label: "a", color: "rgb(149, 251, 81)" }],
      range: [0, 4],
    }
    expect(graphData).toEqual(expected)
  })

  test("parse error", () => {
    const code = `abc`
    const parseResult = parse(code)
    const expected: Log = [
      {
        line: 1,
        charPositionInLine: 1,
        msg: "extraneous input 'abc' expecting <EOF>",
      },
    ]
    expect(parseResult.log).toEqual(expected)
  })

  test("semantic error", () => {
    const code = `
      var a = 1
      var a = 1
    `
    const parseResult = parse(code)
    const expected: Log = [
      {
        line: 3,
        charPositionInLine: 11,
        msg: "var `a` already exists",
      },
    ]
    expect(parseResult.log).toEqual(expected)
  })
})
