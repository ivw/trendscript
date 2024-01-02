export const defaultInput = `var bank = 10000 { label: "Checking account" }
var salary = 1234 { color: "hidden" }

date endOfYear = */12/-1
date endOfMonth = */*/-1
date everyBirthday = */1/2

at endOfMonth, if (bank < 18000) { bank += salary } else { bank -= 100 }
at everyBirthday, bank += 100

options {
  // startDate: "1/1/2024"
  duration: "5y"
  height: 200
}
`
