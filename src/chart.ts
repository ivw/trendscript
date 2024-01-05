import { axisBottom, axisLeft } from "d3-axis"
import { scaleLinear, scaleTime } from "d3-scale"
import { interpolateTurbo } from "d3-scale-chromatic"
import { create, pointer } from "d3-selection"
import { area, line } from "d3-shape"
import { addDays } from "date-fns"
import last from "lodash/last"
import { GraphData, StateKeyProps } from "./evaluate"

const output = document.getElementById("output")!

const averageCharWidth = 10 // An estimate.

function getMarginRight(isLineLegend: boolean, stateKeysProps: Array<StateKeyProps>) {
  if (isLineLegend) {
    const maxLabelLength: number = stateKeysProps.reduce((prev, currentProps) => {
      const currentLabel = currentProps.label ?? currentProps.key
      if (currentLabel.length > prev) {
        return currentLabel.length
      }
      return prev
    }, 0)
    return maxLabelLength * averageCharWidth
  }
  return 30
}

export function render(graphData: GraphData) {
  const { startDate, nrDays, heightPx, stateKeysProps, graphType, strokeWidth, legend } =
    graphData.options

  if (!(heightPx > 0)) {
    output.replaceChildren()
    return
  }

  const margin = {
      top: 20,
      right: getMarginRight(legend === "line", stateKeysProps),
      bottom: 30,
      left: 60,
    },
    width = output.clientWidth - margin.left - margin.right,
    height = heightPx - margin.top - margin.bottom

  const xScale = scaleTime([startDate, addDays(startDate, nrDays - 1)], [0, width])
  const yScale = scaleLinear(graphData.range, [height, 0])

  const colors = stateKeysProps.map(
    (stateKeyProps, index) =>
      stateKeyProps.color ?? interpolateTurbo((index + 1) / (stateKeysProps.length + 1)),
  )

  const svg = create("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

  const container = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`)

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
      .attr("stroke", (_, index) => colors[index])
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
      .attr("fill", (_, index) => colors[index])
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
      .style("fill", (_, index) => colors[index])
      .style("font-size", 8)
      .text((props) => props.label ?? props.key)
  }

  const focusContainer = container.append("g").style("opacity", 0)
  // Vertical line:
  focusContainer.append("rect").attr("width", 1).attr("height", height).attr("fill", "gray")

  const focusLabels = focusContainer
    .selectAll("text.focusLabel")
    .data(graphData.data)
    .join("text")
    .attr("class", "focusLabel")
    .style("fill", (_, index) => colors[index])
    .style("font-size", 8)

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

      focusContainer.attr("transform", `translate(${x},0)`)
      focusLabels.attr("y", (d) => yScale(d[day]) + 4).text((d) => `${d[day]}`)
    })
    .on("mouseout", () => {
      focusContainer.style("opacity", 0)
    })

  output.replaceChildren(svg.node()!)
}
