import { clamp } from "../../src/math/clamp";

describe("Math", () => {

  interface TestCase {
    min: number;
    max: number;
    value: number;
    expected: number;
  }

  const testCases: TestCase[] = [
    { min: 0, max: 1, value: 0, expected: 0 },
    { min: 0, max: 1, value: 0.5, expected: 0.5 },
    { min: 0, max: 1, value: 1, expected: 1 },
    { min: 0, max: 1, value: -1, expected: 0 },
    { min: 0, max: 1, value: 2, expected: 1 },
    { min: 0, max: 1, value: 0.5, expected: 0.5 },
    { min: 0, max: 1, value: 0.5, expected: 0.5 },
    { min: 0, max: 1, value: 0.5, expected: 0.5 },
    { min: 0, max: 1, value: 0.5, expected: 0.5 },
  ];

  test.each(testCases)("clamp(%p, %p, %p) should return %p", (testCase) => {
    const { min, max, value, expected } = testCase;
    expect(clamp(value, min, max)).toBe(expected);
  });
});
