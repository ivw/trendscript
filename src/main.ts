import { startOfDay } from "date-fns"
import "./chart"
import { render } from "./chart"
import { GraphData, MutateState, State, getGraphData } from "./evaluate"
import "./style.css"
import debounce from "lodash/debounce"
import { defaultInput } from "./defaultInput"
import { parse } from "./parse"
import { displayMessages } from "./codeMessages"

const codeInput = document.getElementById("code-input") as HTMLTextAreaElement
codeInput.value = defaultInput

const startDate = startOfDay(new Date())
const nrDays = 365 * 2

let graphData: GraphData | null = null

function updateGraphData() {
  const parseResult = parse(codeInput.value)
  displayMessages(parseResult.log)
  if (parseResult.log.length > 0) {
    return
  }

  const mutateState: MutateState = (state, date, day) => {
    parseResult.rules.forEach((rule) => rule(state, date, day))
  }

  graphData = getGraphData(
    parseResult.initialState,
    startDate,
    nrDays,
    mutateState,
    Object.keys(parseResult.initialState),
  )
  render(graphData, startDate, nrDays)
}

updateGraphData()
codeInput.addEventListener("input", debounce(updateGraphData, 200))

window.addEventListener(
  "resize",
  debounce(() => {
    if (graphData) {
      render(graphData, startDate, nrDays)
    }
  }, 50),
)
