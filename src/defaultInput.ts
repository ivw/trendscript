export const defaultInput = `// Example: 5-year personal finance forecast
// Play around with variables and rules, and see what kind of effect it has on the chart!

var account = 10000 { label: "Checking account" }
var investment = 0
var investmentReturnMonthly = 1 + (.8 / 100) { color: "hidden" }
var salaryMonthly = 5000
var costOfLivingMonthly = 3000 { color: "hidden" }

date endOfMonth = *-*-31
date endOfYear = *-12-31

at endOfMonth, {
  account += salaryMonthly
  investment *= investmentReturnMonthly
  account -= costOfLivingMonthly

  if (account > costOfLivingMonthly * 6 && account > investment / 2) {
    account -= 5000
    investment += 5000
  }
}

at endOfYear, {
  account += salaryMonthly // bonus
  salaryMonthly *= 1.05 // raise
  costOfLivingMonthly *= 1.05 // inflation
}

at 2024-03-15, account += 2000

options {
  startDate: "Jan 1 2024"
  duration: "5y"
  height: 200
}
`
