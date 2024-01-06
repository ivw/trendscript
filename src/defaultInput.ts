export const defaultInput = `var account = 10000 { label: "Checking account" }
var salary = 1234 { color: "red" }
var foo = 0

date endOfYear = *-12-31
date endOfMonth = *-*-31
date endOfDay = *-*-*
date everyBirthday = *-1-2

at endOfMonth, if (account < 18000) { account += salary } else { account -= 100 }
at everyBirthday, account += 100
at endOfDay, { foo += 5; foo *= 1.001 }

options {
  // startDate: "2024-01-01"
  duration: "5y"
  height: 200
}
`
