import { describe, expect, test } from "vitest"
import { createDatePattern } from "./dateUtils"

describe("createDatePattern", () => {
  test("single date", () => {
    const datePattern = createDatePattern(2020, 1, 2)
    expect(datePattern(new Date(2020, 1 - 1, 2))).toBe(true)
    expect(datePattern(new Date(2020, 1 - 1, 3))).toBe(false)
  })

  test("single date with negative days", () => {
    const datePattern = createDatePattern(2023, 2, 31)
    expect(datePattern(new Date(2023, 2 - 1, 28))).toBe(true)
    expect(datePattern(new Date(2023, 2 - 1, 27))).toBe(false)
    expect(datePattern(new Date(2023, 3 - 1, 31))).toBe(false)
    expect(datePattern(new Date(2023, 3 - 1, 30))).toBe(false)
  })

  test("recurring date", () => {
    const datePattern = createDatePattern(2023, null, 31)
    expect(datePattern(new Date(2023, 2 - 1, 28))).toBe(true)
    expect(datePattern(new Date(2023, 2 - 1, 27))).toBe(false)
    expect(datePattern(new Date(2023, 3 - 1, 31))).toBe(true)
    expect(datePattern(new Date(2023, 3 - 1, 30))).toBe(false)
  })
})
