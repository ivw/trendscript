import { axisBottom, axisLeft } from "d3-axis"
import { scaleLinear, scaleTime } from "d3-scale"
import { pointer, select } from "d3-selection"
import { area, line } from "d3-shape"
import { addDays } from "date-fns"
import last from "lodash/last"
import round from "lodash/round"
import { GraphData, StateKeyProps } from "./evaluate"

const output = document.getElementById("output")!
const chartContainer = document.getElementById("chart-container")!

const estimatedCharWidth = 10

function getMarginRight(stateKeysProps: Array<StateKeyProps>) {
  const maxLabelLength: number = stateKeysProps.reduce((prev, currentProps) => {
    if (currentProps.label.length > prev) {
      return currentProps.label.length
    }
    return prev
  }, 0)
  return maxLabelLength * estimatedCharWidth
}

export function render(graphData: GraphData) {
  const { startDate, nrDays, heightPx, stateKeysProps, graphType, strokeWidth, legend } =
    graphData.options

  chartContainer.replaceChildren()

  if (!(heightPx > 0)) {
    return
  }

  const margin = {
      top: 20,
      right: getMarginRight(stateKeysProps),
      bottom: 30,
      left: 60,
    },
    width = output.clientWidth - margin.left - margin.right,
    height = heightPx - margin.top - margin.bottom

  const xScale = scaleTime([startDate, addDays(startDate, nrDays - 1)], [0, width])
  const yScale = scaleLinear(graphData.range, [height, 0])

  const svg = select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

  const container = svg
    .select("#chart-container")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

  container
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
      axisBottom(xScale)
        .ticks(width / 100)
        .tickSizeOuter(0),
    )
  container.append("g").call(axisLeft(yScale).ticks(height / 40))

  if (graphType === "line") {
    container
      .selectAll(".line")
      .append("path")
      .data(graphData.data)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", (_, index) => stateKeysProps[index].color ?? "white")
      .attr("stroke-width", strokeWidth)
      .attr(
        "d",
        line<number>()
          .x((_d, index) => xScale(addDays(startDate, index)))
          .y(yScale),
      )
  }
  if (graphType === "area") {
    container
      .selectAll(".line")
      .append("path")
      .data(graphData.data)
      .join("path")
      .attr("fill", (_, index) => stateKeysProps[index].color ?? "white")
      .attr(
        "d",
        area<number>()
          .x((_d, index) => xScale(addDays(startDate, index)))
          .y0(yScale(0))
          .y1(yScale),
      )
  }

  // Legend:
  if (legend === "line") {
    container
      .selectAll("text.label")
      .data(stateKeysProps)
      .join("text")
      .attr("class", "label")
      .attr("x", width + 5)
      .attr("y", (_, index) => yScale(last(graphData.data[index]) ?? 0) + 4)
      .style("fill", ({ color }) => color ?? "white")
      .text(({ label }) => label)
  }

  const focusContainer = container.append("g").style("opacity", 0)
  // Vertical line:
  focusContainer.append("rect").attr("width", 1).attr("height", height).attr("fill", "gray")

  const focusDateText = focusContainer
    .append("text")
    .attr("y", -4)
    .style("fill", "currentColor")
    .attr("font-size", 12)

  const focusLabels = focusContainer
    .selectAll("text.focusLabel")
    .data(graphData.data)
    .join("text")
    .attr("class", "focusLabel")
    .attr("x", 5)
    .style("fill", "white")

  // Mouse events box:
  container
    .append("rect")
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", () => {
      focusContainer.style("opacity", 1)
    })
    .on("mousemove", (e: MouseEvent) => {
      const [x] = pointer(e)
      const day = Math.round((x / width) * nrDays)
      if (day >= 0 && day < nrDays) {
        const date = addDays(startDate, day)
        focusContainer.attr("transform", `translate(${x},0)`)
        focusDateText.text(date.toLocaleDateString())
        focusLabels
          .attr("y", (d) => yScale(d[day]) + 4)
          .text((d, index) => {
            const value = round(d[day], 2)
            if (legend === "none") {
              const { label } = stateKeysProps[index]
              return `${label}: ${value}`
            }
            return value
          })
      }
    })
    .on("mouseout", () => {
      focusContainer.style("opacity", 0)
    })
}
