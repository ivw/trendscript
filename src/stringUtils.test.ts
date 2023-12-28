import { describe, expect, test } from "vitest"
import { getIndexOfLine } from "./stringUtils"

describe("getIndexOfLine", () => {
  test("simple", () => {
    const text = `foo
bar
abc
xyz`
    expect(getIndexOfLine(text, 0)).toBe(0)
    expect(getIndexOfLine(text, 1)).toBe(4)
    expect(getIndexOfLine(text, 2)).toBe(8)
    expect(getIndexOfLine(text, 22)).toBe(-1)
  })
})
