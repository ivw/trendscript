import { addDays, startOfDay } from "date-fns"

export type State = { [key: string]: number }

export type Rule = {
  mutateState: (date: Date, state: State) => void
}

export function evaluateRulesForDateRange(
  initialState: State,
  rules: Array<Rule>, // TODO what is even the point of this being an array? you can combine them into one.
  startDate: Date,
  nrDays: number,
  onDay?: (date: Date, state: State) => void, // TODO could be an extra rule in rules?
): State {
  startDate = startOfDay(startDate)
  let state: State = Object.assign({}, initialState)
  for (let i = 0; i < nrDays; i++) {
    const date = addDays(startDate, i)
    rules.forEach((rule) => rule.mutateState(date, state))
    onDay && onDay(date, state)
  }
  return state
}

export type GraphData = {
  dataPerStateKey: Array<StateKeyData>
  range: [number, number]
}

export type StateKeyData = {
  stateKey: string
  valuePerDay: Array<number>
}

export function getGraphData(
  initialState: State,
  rules: Array<Rule>,
  startDate: Date,
  nrDays: number,
  stateKeys: Array<string>,
): GraphData {
  let min = 0
  let max = 0
  const dataPerStateKey: Array<StateKeyData> = stateKeys.map((stateKey) => ({
    stateKey,
    valuePerDay: [],
  }))
  evaluateRulesForDateRange(initialState, rules, startDate, nrDays, (_, state) => {
    stateKeys.forEach((stateKey, stateKeyIndex) => {
      const value = state[stateKey]
      dataPerStateKey[stateKeyIndex].valuePerDay.push(value)
      if (value > max) {
        max = value
      }
      if (value < min) {
        min = value
      }
    })
  })
  return { dataPerStateKey, range: [min, max] }
}
