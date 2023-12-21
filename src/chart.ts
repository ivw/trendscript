// TODO can we use specific imports?
import * as d3 from "d3"
import { GraphData } from "./evaluate"
import { addDays } from "date-fns"

const output = document.getElementById("output")!

export function render(graphData: GraphData, startDate: Date, nrDays: number) {
  const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 1000 - margin.left - margin.right, // TODO dynamic width
    height = 200 - margin.top - margin.bottom

  const x = d3.scaleTime([startDate, addDays(startDate, nrDays)], [0, width])
  const y = d3.scaleLinear(graphData.range, [height, 0])

  const line = d3
    .line<number>()
    .x((_d, index) => x(addDays(startDate, index)))
    .y(y)

  const svg = d3
    .create("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

  const container = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

  container
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0),
    )
  container.append("g").call(d3.axisLeft(y).ticks(height / 40))

  container
    .selectAll(".line")
    .append("path")
    .data(graphData.dataPerStateKey.map((it) => it.valuePerDay))
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (_, stateKeyIndex) =>
      d3.interpolateTurbo((stateKeyIndex + 1) / (graphData.dataPerStateKey.length + 1)),
    )
    .attr("stroke-width", 1.5)
    .attr("d", line)

  output.replaceChildren(svg.node()!)
}
