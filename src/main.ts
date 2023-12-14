import "./style.css"
import "./chart"

const codeInput: HTMLTextAreaElement = document.getElementById("code-input") as HTMLTextAreaElement

codeInput.value = `var bank = 10000
var salary = 1234

date endOfYear = */-1/-1
date endOfMonth = */*/-1
date everyBirthday = */1/2

at endOfMonth, bank += salary
at everyBirthday, bank += 100
`
