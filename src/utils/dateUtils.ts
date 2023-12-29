import { getDaysInMonth } from "date-fns"

export type DatePattern = (date: Date) => boolean

/**
 *
 * @param year
 * @param month
 * @param day If negative, represents days before end of month.
 * @returns
 */
export function createDatePattern(
  year: number | null,
  month: number | null,
  day: number | null,
): DatePattern {
  return (date) => {
    if (year !== null) {
      if (year >= 0) {
        if (date.getFullYear() !== year) return false
      } else {
        return false
      }
    }
    if (month !== null) {
      if (month >= 0) {
        if (date.getMonth() + 1 !== month) return false
      } else {
        return false
      }
    }
    if (day !== null) {
      if (day >= 0) {
        if (date.getDate() + 1 !== day) return false
      } else {
        if (date.getDate() - getDaysInMonth(date) !== day) return false
      }
    }
    return true
  }
}
