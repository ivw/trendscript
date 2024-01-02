import debounce from "lodash/debounce"
import "./chart"
import { render } from "./chart"
import { displayMessages } from "./codeMessages"
import { defaultInput } from "./defaultInput"
import { GraphData } from "./evaluate"
import { parse } from "./parse"
import "./style.css"

const codeInput = document.getElementById("code-input") as HTMLTextAreaElement
codeInput.value = defaultInput

let graphData: GraphData | null = null

function updateGraphData() {
  const parseResult = parse(codeInput.value)
  displayMessages(parseResult.log)
  if (parseResult.graphData) {
    graphData = parseResult.graphData
    render(graphData)
  }
}

updateGraphData()
codeInput.addEventListener("input", debounce(updateGraphData, 200))

window.addEventListener(
  "resize",
  debounce(() => {
    if (graphData) {
      render(graphData)
    }
  }, 50),
)
