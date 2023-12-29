export const defaultInput = `var bank = 10000
var salary = 1234

date endOfYear = */12/-1
date endOfMonth = */*/-1
date everyBirthday = */1/2

at endOfMonth, if (bank < 18000) { bank += salary } else { bank -= 100 }
at everyBirthday, bank += 100
`
