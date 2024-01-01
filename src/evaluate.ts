import { addDays, startOfDay } from "date-fns"

export type State = Record<string, number>

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
  data: Array<Array<number>>
  stateKeysProps: Array<StateKeyProps>
  range: [number, number]
}

export type StateKeyProps = {
  key: string
  label: string
  color: string
}

export function getGraphData(
  initialState: State,
  startDate: Date,
  nrDays: number,
  mutateState: MutateState,
  stateKeysProps: Array<StateKeyProps>,
): GraphData {
  let min = 0
  let max = 0
  const data: Array<Array<number>> = stateKeysProps.map(() => [])
  evaluateRulesForDateRange(initialState, startDate, nrDays, (state, date, day) => {
    mutateState(state, date, day)
    stateKeysProps.forEach((stateKeyProps, stateKeyIndex) => {
      const value = state[stateKeyProps.key]
      data[stateKeyIndex].push(value)
      if (value > max) {
        max = value
      }
      if (value < min) {
        min = value
      }
    })
  })
  return { data, stateKeysProps, range: [min, max] }
}
