import { getDaysInMonth } from "date-fns"

export type DatePattern = (date: Date) => boolean

export const emptyDatePattern: DatePattern = () => false

/**
 *
 * @param year
 * @param month
 * @param day If past the number of days in the month,
 *   then it will be treated as the last day in the month.
 * @returns
 */
export function createDatePattern(
  year: number | null,
  month: number | null,
  day: number | null,
): DatePattern {
  return (date) => {
    if (year !== null && date.getFullYear() !== year) return false
    if (month !== null && date.getMonth() + 1 !== month) return false
    if (day !== null && date.getDate() !== Math.min(day, getDaysInMonth(date))) return false
    return true
  }
}
