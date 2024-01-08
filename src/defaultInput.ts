export const defaultInput = `var account = 10000 { label: "Checking account" }
var investment = 0
var investmentReturnMonthly = 1 + (.8 / 100) { color: "hidden" }
var salaryMonthly = 5000
var costOfLivingMonthly = 3000 { color: "hidden" }

date endOfYear = *-12-31
date endOfMonth = *-*-31

at endOfMonth, {
  account += salaryMonthly
  investment *= investmentReturnMonthly
  account -= costOfLivingMonthly

  if (account > 30000 && account > investment / 2) {
    account -= 10000
    investment += 10000
  }
}

at endOfYear, {
  account += salaryMonthly // bonus
  salaryMonthly *= 1.05 // raise
  costOfLivingMonthly *= 1.05 // the way it is
}

at 2025-03-15, account += 1000

options {
  duration: "5y"
  height: 200
}
`
