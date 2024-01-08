import debounce from "lodash/debounce"
import "./chart"
import { render } from "./chart"
import { displayMessages } from "./codeMessages"
import { defaultInput } from "./defaultInput"
import { GraphData } from "./evaluate"
import { parse } from "./parse"
import "./style.css"

const localStorageKey = "input"

const codeInput = document.getElementById("code-input") as HTMLTextAreaElement
codeInput.value = getInitialInput()

let graphData: GraphData | null = null

function updateGraphData() {
  const code = codeInput.value
  const parseResult = parse(code)
  displayMessages(parseResult.log)
  if (parseResult.graphData) {
    graphData = parseResult.graphData
    render(graphData)
  }
  localStorage.setItem(localStorageKey, code)
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

function getInitialInput(): string {
  try {
    const storedCode = localStorage.getItem(localStorageKey)
    if (storedCode) {
      return storedCode
    }
  } catch (e) {}
  return defaultInput
}
