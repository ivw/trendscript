export function getIndexOfLine(text: string, line: number, startIndex: number = 0): number {
  if (line === 0) return 0
  let linesFound = 0
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === "\n") {
      linesFound++
      if (linesFound === line) return i + 1
    }
  }
  return -1
}
