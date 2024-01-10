import { expect, test } from "vitest"
import {
  GraphData,
  GraphOptions,
  MutateState,
  State,
  evaluateRulesForDateRange,
  getGraphData,
} from "./evaluate"

const initialState: State = {
  foo: 100,
}

const mutateState: MutateState = (state, date) => {
  state.foo += 1
  if (date.getDate() % 2 == 0) {
    state.foo += 10
  }
}

// Feb 02 2000
const startDate = new Date(2000, 1, 2)

const nrDays = 5

test("evaluateRulesForDateRange", () => {
  expect(evaluateRulesForDateRange(initialState, startDate, nrDays, mutateState)).toEqual({
    foo: 135,
  })
})

test("getGraphData", () => {
  const options: GraphOptions = {
    startDate,
    nrDays,
    heightPx: 200,
    stateKeysProps: [{ key: "foo", label: "foo", color: "red" }],
    chartType: "line",
    strokeWidth: 2,
    legend: "line",
  }

  const expected: GraphData = {
    data: [[111, 112, 123, 124, 135]],
    range: [0, 135],
    options,
  }
  expect(getGraphData(initialState, mutateState, options)).toEqual(expected)
})
