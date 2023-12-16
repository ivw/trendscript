import { addDays, startOfDay } from "date-fns"

export type State = { [key: string]: number }

export type Rule = {
  mutateState: (date: Date, state: State) => void
}

export function evaluateRulesForDateRange(
  initialState: State,
  rules: Array<Rule>,
  startDate: Date,
  nrDays: number,
): Array<State> {
  const result: Array<State> = []

  let date: Date = startOfDay(startDate)
  let stateOfDay: State = initialState
  while (result.length < nrDays) {
    stateOfDay = Object.assign({}, stateOfDay)
    rules.forEach((rule) => rule.mutateState(date, stateOfDay))

    date = addDays(date, 1)
    result.push(stateOfDay)
  }
  return result
}
