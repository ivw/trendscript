import { addDays, startOfDay } from "date-fns"

export type State = { [key: string]: number }

export type MutateState = (date: Date, state: State) => void

export function evaluateRulesForDateRange(
  initialState: State,
  startDate: Date,
  nrDays: number,
  mutateState: MutateState,
): State {
  let state: State = Object.assign({}, initialState)
  for (let i = 0, date = startOfDay(startDate); i < nrDays; i++, date = addDays(date, 1)) {
    mutateState(date, state)
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
  evaluateRulesForDateRange(initialState, startDate, nrDays, (date, state) => {
    mutateState(date, state)
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
