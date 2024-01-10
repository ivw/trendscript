import { describe, expect, test } from "vitest"
import { GraphData } from "./evaluate"
import { Log, parse } from "./parse"

describe("parse", () => {
  test("success", () => {
    const code = `
      var a = 1 { label: "A", color: "red" }

      date b = *-*-*

      at b, a += 1

      options { startDate: "02/02/2000", duration: "3d" }
    `

    const parseResult = parse(code)
    const expected: GraphData = {
      data: [[2, 3, 4]],
      range: [0, 4],
      options: {
        startDate: new Date(2000, 2 - 1, 2),
        nrDays: 3,
        heightPx: 200,
        stateKeysProps: [{ key: "a", label: "A", color: "red" }],
        chartType: "line",
        strokeWidth: 2,
        legend: "line",
      },
    }
    expect(parseResult.graphData).toEqual(expected)
  })

  test("parse error", () => {
    const code = `abc`
    const parseResult = parse(code)
    const expected: Log = [
      {
        line: 1,
        charPositionInLine: 1,
        msg: "extraneous input 'abc' expecting {<EOF>, 'options'}",
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
