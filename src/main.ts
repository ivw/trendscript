import "./style.css"
import "./chart"
import { render } from "./chart"
import { Rule, State, evaluateRulesForDateRange } from "./evaluate"

const codeInput: HTMLTextAreaElement = document.getElementById("code-input") as HTMLTextAreaElement

codeInput.value = `var bank = 10000
var salary = 1234

date endOfYear = */-1/-1
date endOfMonth = */*/-1
date everyBirthday = */1/2

at endOfMonth, bank += salary
at everyBirthday, bank += 100
`

function update() {
  // TODO parse code input, verify and convert to state and rules.
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
        if (date.getDate() == 1) {
          state.foo += 50
        }
      },
    },
  ]
  // Feb 02 2000
  const startDate = new Date(2000, 1, 2)
  const nrDays = 365

  const statesPerDay = evaluateRulesForDateRange(initialState, rules, startDate, nrDays)
  render(statesPerDay, startDate, nrDays, "foo")
}

update()
// TODO update whenever the input changes (with small debounce).
