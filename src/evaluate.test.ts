import { expect, test } from "vitest"
import { GraphData, Rule, State, evaluateRulesForDateRange, getGraphData } from "./evaluate"

const initialState: State = {
  foo: 100,
}

const rules: Array<Rule> = [
  {
    mutateState: (_date, state) => {
      state.foo += 1
    },
  },
  {
    mutateState: (date, state) => {
      if (date.getDate() % 2 == 0) {
        state.foo += 10
      }
    },
  },
]

// Feb 02 2000
const startDate = new Date(2000, 1, 2)

const nrDays = 5

test("evaluateRulesForDateRange", () => {
  expect(evaluateRulesForDateRange(initialState, rules, startDate, nrDays)).toEqual({
    foo: 135,
  })
})

test("getGraphData", () => {
  // TODO should it not include the initial state?
  const expected: GraphData = {
    dataPerStateKey: [
      {
        stateKey: "foo",
        valuePerDay: [111, 112, 123, 124, 135],
      },
    ],
    range: [0, 135],
  }
  expect(getGraphData(initialState, rules, startDate, nrDays, ["foo"])).toEqual(expected)
})
