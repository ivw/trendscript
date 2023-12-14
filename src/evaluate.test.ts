import { expect, test } from "vitest";
import { Rule, State, evaluateRulesForDateRange } from "./evaluate";

test("evaluateRulesForDateRange", () => {
  const initialState: State = {
    foo: 100,
  };

  const rules: Array<Rule> = [
    {
      mutateState: (_date, state) => {
        state.foo += 1;
      },
    },
    {
      mutateState: (date, state) => {
        if (date.getDate() % 2 == 0) {
          state.foo += 10;
        }
      },
    },
  ];

  // Feb 02 2000
  const startDate = new Date(2000, 1, 2);

  // TODO should it not include the initial state?
  expect(evaluateRulesForDateRange(initialState, rules, startDate, 5)).toEqual([
    { foo: 111 },
    { foo: 112 },
    { foo: 123 },
    { foo: 124 },
    { foo: 135 },
  ]);
});
