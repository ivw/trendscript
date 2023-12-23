import { addDays, startOfDay } from "date-fns"

export type State = { [key: string]: number }

export type MutateState = (state: State, date: Date, day: number) => void

export function evaluateRulesForDateRange(
  initialState: State,
  startDate: Date,
  nrDays: number,
  mutateState: MutateState,
): State {
  let state: State = Object.assign({}, initialState)
  for (let day = 0, date = startOfDay(startDate); day < nrDays; day++, date = addDays(date, 1)) {
    mutateState(state, date, day)
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
  startDate: Date,
  nrDays: number,
  mutateState: MutateState,
  stateKeys: Array<string>,
): GraphData {
  let min = 0
  let max = 0
  const dataPerStateKey: Array<StateKeyData> = stateKeys.map((stateKey) => ({
    stateKey,
    valuePerDay: [],
  }))
  evaluateRulesForDateRange(initialState, startDate, nrDays, (state, date, day) => {
    mutateState(state, date, day)
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
