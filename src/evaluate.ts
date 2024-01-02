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
  range: [number, number]
  options: GraphOptions
}

export type GraphOptions = {
  startDate: Date
  nrDays: number
  heightPx: number
  stateKeysProps: Array<StateKeyProps>
}

export type StateKeyProps = {
  key: string
  label?: string
  color?: string
}

export function getGraphData(
  initialState: State,
  mutateState: MutateState,
  options: GraphOptions,
): GraphData {
  let min = 0
  let max = 0
  const data: Array<Array<number>> = options.stateKeysProps.map(() => [])
  evaluateRulesForDateRange(initialState, options.startDate, options.nrDays, (state, date, day) => {
    mutateState(state, date, day)
    options.stateKeysProps.forEach((stateKeyProps, stateKeyIndex) => {
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
  return { data, range: [min, max], options }
}
