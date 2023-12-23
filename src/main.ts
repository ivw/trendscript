import { startOfDay } from "date-fns"
import "./chart"
import { render } from "./chart"
import { GraphData, MutateState, State, getGraphData } from "./evaluate"
import "./style.css"
import debounce from "lodash/debounce"
import { defaultInput } from "./defaultInput"

const codeInput = document.getElementById("code-input") as HTMLTextAreaElement
codeInput.value = defaultInput

const startDate = startOfDay(new Date())
const nrDays = 365 * 2

let graphData: GraphData | null = null

function updateGraphData() {
  // TODO parse code input, verify and convert to state and rules.
  const initialState: State = {
    foo: 100,
    bar: 10,
  }
  const mutateState: MutateState = (state, date) => {
    state.foo += 1
    state.bar += 2
    if (date.getDate() == 1) {
      state.foo += 50
    }
  }

  graphData = getGraphData(initialState, startDate, nrDays, mutateState, Object.keys(initialState))
  render(graphData, startDate, nrDays)
}

updateGraphData()
// TODO updateGraphData whenever the input changes (with small debounce).

window.addEventListener(
  "resize",
  debounce(() => {
    if (graphData) {
      render(graphData, startDate, nrDays)
    }
  }, 50),
)
