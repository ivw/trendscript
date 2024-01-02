import { axisBottom, axisLeft } from "d3-axis"
import { scaleLinear, scaleTime } from "d3-scale"
import { interpolateTurbo } from "d3-scale-chromatic"
import { create } from "d3-selection"
import { line } from "d3-shape"
import { addDays } from "date-fns"
import last from "lodash/last"
import { GraphData } from "./evaluate"

const output = document.getElementById("output")!

export function render(graphData: GraphData) {
  const { startDate, nrDays, heightPx, stateKeysProps } = graphData.options

  const margin = { top: 20, right: 80, bottom: 30, left: 60 },
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

  container
    .selectAll(".line")
    .append("path")
    .data(graphData.data)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (_, index) => colors[index])
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      line<number>()
        .x((_d, index) => xScale(addDays(startDate, index)))
        .y(yScale),
    )

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

  output.replaceChildren(svg.node()!)
}
