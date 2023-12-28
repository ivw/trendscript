import { describe, expect, test } from "vitest"
import { createDatePattern } from "./dateUtils"

describe("createDatePattern", () => {
  test("single date", () => {
    const datePattern = createDatePattern(2020, 1, 2)
    expect(datePattern(new Date("2020-01-02"))).toBe(true)
    expect(datePattern(new Date("2020-01-03"))).toBe(false)
  })

  test("single date with negative days", () => {
    const datePattern = createDatePattern(2023, 12, -1)
    expect(datePattern(new Date("2023-12-31"))).toBe(true)
    expect(datePattern(new Date("2023-12-30"))).toBe(false)
    expect(datePattern(new Date("2023-11-30"))).toBe(false)
    expect(datePattern(new Date("2023-11-29"))).toBe(false)
  })

  test("recurring date", () => {
    const datePattern = createDatePattern(2023, null, -1)
    expect(datePattern(new Date("2023-12-31"))).toBe(true)
    expect(datePattern(new Date("2023-12-30"))).toBe(false)
    expect(datePattern(new Date("2023-11-30"))).toBe(true)
    expect(datePattern(new Date("2023-11-29"))).toBe(false)
  })
})
