# TrendScript

TrendScript is web app where you use a simple scripting language to visualize values over time, based on custom rules.

## Example code

```
// Example: 5-year personal finance forecast
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
  costOfLivingMonthly *= 1.05 // the way it is
}

at 2024-03-15, account += 2000

options {
  startDate: "Jan 1 2024"
  duration: "5y"
  height: 200
}
```

## Documentation

### Numeric variables

```
var a = 0 {
  label: "Label"
  color: "red"
}
```

The `{}` options are optional. By default, the var name is used as the label, and a unique color will be chosen.

A var will show up on the chart unless it has the option `color = "hidden"`. Any valid HTML/CSS color string can be used.

### Date patterns

```
date specificDate = 2024-12-25
date endOfYear = *-12-31
```

Format: YYYY-MM-DD, but any part can be replaced with a `*` to make it repeating.

The last day of the month can be represented as 31, even if the month has less than 31 days.

### Rules

```
at myDatePattern, myValue += 1 + 2
at 2024-12-25, {
  a = 3
  b = a * 2
}
at *-*-*, if (a > 10) { b += 1 }
```

A rule has a date pattern and an action.
You can use an existing date pattern or express one in-line.
The action can be an assignment, a block of actions, or a conditional action (see the examples above).

The action syntax resembles JavaScript. You can see the full syntax in the grammar file: [src/TrendScript.g4](src/TrendScript.g4)

### Options

You can have one options statement at the end of the file to customize the chart:

```
options {
  startDate: "Jan 1 2024" // Default: today.

  duration: "5y" // `y` = years, `m` = months, `d` = days.

  height: 200 // Chart height in pixels. Default: 200

  chartType: "line" // Options: "line", "area"

  strokeWidth: 2 // Default: 2

  legend: "line" // Options: "line", "none"
}
```

## Installation

Install the dependencies with `npm install`.

Run `npm run generateParser` once, and rerun whenever you change the grammar file.

Start the development server:

```
npm run dev
```

Start the test runner:

```
npm test
```

## Tech stack

[Vite](https://vitejs.dev/) (vanilla-ts): development and build tooling

[ANTLR](https://www.antlr.org/): parser generator

[D3](https://d3js.org/): data visualization library
