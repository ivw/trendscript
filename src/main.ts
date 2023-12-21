import { startOfDay } from "date-fns"
import "./chart"
import { render } from "./chart"
import { MutateState, State, getGraphData } from "./evaluate"
import "./style.css"

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
    bar: 10,
  }
  const mutateState: MutateState = (date, state) => {
    state.foo += 1
    state.bar += 2
    if (date.getDate() == 1) {
      state.foo += 50
    }
  }
  // Feb 02 2000
  const startDate = startOfDay(new Date())
  const nrDays = 365

  const graphData = getGraphData(
    initialState,
    startDate,
    nrDays,
    mutateState,
    Object.keys(initialState),
  )
  render(graphData, startDate, nrDays)
}

update()
// TODO update whenever the input changes (with small debounce).
