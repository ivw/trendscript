import { Log } from "./parse"
import { getIndexOfLine } from "./utils/stringUtils"

const codeInput = document.getElementById("code-input") as HTMLTextAreaElement

const codeMessagesContainer = document.getElementById("code-messages")!

function highlight(line: number, charPositionInLine: number) {
  const start = getIndexOfLine(codeInput.value, line - 1) + charPositionInLine - 1

  codeInput.focus()
  codeInput.setSelectionRange(start, start)
}
;(window as any).highlight = highlight

export function displayMessages(log: Log) {
  codeMessagesContainer.innerHTML = log
    .map(
      (msg) =>
        `<div class="code-msg"><button type="button" class="goto-code-button" onclick="highlight(${msg.line},${msg.charPositionInLine})">${msg.line}:${msg.charPositionInLine}</button> ${msg.msg}</div>`,
    )
    .join("")
}
