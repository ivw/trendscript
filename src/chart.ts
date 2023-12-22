import { axisBottom, axisLeft } from "d3-axis"
import { scaleLinear, scaleTime } from "d3-scale"
import { interpolateTurbo } from "d3-scale-chromatic"
import { create } from "d3-selection"
import { line } from "d3-shape"
import { addDays } from "date-fns"
import { GraphData } from "./evaluate"

const output = document.getElementById("output")!

export function render(graphData: GraphData, startDate: Date, nrDays: number) {
  const margin = { top: 10, right: 20, bottom: 30, left: 60 },
    width = output.clientWidth - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom

  const xScale = scaleTime([startDate, addDays(startDate, nrDays)], [0, width])
  const yScale = scaleLinear(graphData.range, [height, 0])

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
    .data(graphData.dataPerStateKey.map((it) => it.valuePerDay))
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (_, stateKeyIndex) =>
      interpolateTurbo((stateKeyIndex + 1) / (graphData.dataPerStateKey.length + 1)),
    )
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      line<number>()
        .x((_d, index) => xScale(addDays(startDate, index)))
        .y(yScale),
    )

  output.replaceChildren(svg.node()!)
}
