import { startOfDay } from "date-fns"
import debounce from "lodash/debounce"
import "./chart"
import { render } from "./chart"
import { displayMessages } from "./codeMessages"
import { defaultInput } from "./defaultInput"
import { GraphData } from "./evaluate"
import { getGraphDataFromParseResult, parse } from "./parse"
import "./style.css"

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

  graphData = getGraphDataFromParseResult(parseResult, startDate, nrDays)
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
