// TODO can we use specific imports?
import * as d3 from "d3"
import { State } from "./evaluate"
import { addDays } from "date-fns"

const output = document.getElementById("output")!

export function render(
  statesPerDay: Array<State>,
  startDate: Date,
  nrDays: number,
  stateKey: string, // TODO multiple keys
) {
  // Declare the chart dimensions and margins.
  const width = 928
  const height = 200
  const marginTop = 20
  const marginRight = 30
  const marginBottom = 30
  const marginLeft = 40

  const yAccessor = (it: State) => it[stateKey]!

  // Declare the x (horizontal position) scale.
  const x = d3.scaleTime([startDate, addDays(startDate, nrDays)], [marginLeft, width - marginRight])

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear(d3.extent<State, number>(statesPerDay, yAccessor) as [number, number], [
    height - marginBottom,
    marginTop,
  ])

  // Declare the line generator.
  const line = d3
    .line<State>()
    .x((_d, index) => x(addDays(startDate, index)))
    .y((d) => y(yAccessor(d)))

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;")

  // Add the x-axis.
  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0),
    )

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1),
    )

  // Append a path for the line.
  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line(statesPerDay))

  output.replaceChildren(svg.node()!)
}
