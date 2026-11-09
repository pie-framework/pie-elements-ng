import { latexEqual } from "../index";
import { compareNumbers } from "../value";

describe("compareNumbers", () => {
  it.each([
    "6", "+6", "-6", "−6", "(6)", "(-6)", "6.0", ".5", "1,000",
    "2/3", "\\frac{2}{3}", "-\\frac{2}{3}", "\\frac{-2}{3}", "\\frac{1.5}{3}",
    "2\\frac{1}{2}", "-2\\frac{1}{2}",
  ])("reads %s as a number", (latex) => {
    expect(compareNumbers(latex, latex)).toBe(true);
  });

  it.each([
    "", " ", "3+3", "2\\cdot3", "--6", "x", "6x", "\\pi", "50\\%", "\\sqrt{4}", "6cm",
    "\\frac{1}{0}", "\\frac{\\frac{1}{2}}{3}", "2+\\frac{1}{2}", "2\\frac{-1}{2}",
    "1{,}000", "1,5", "r=\\sqrt{\\frac{V}{7\\pi}}", "x+1",
  ])("leaves %s to the mode", (latex) => {
    expect(compareNumbers(latex, latex)).toBeUndefined();
    expect(compareNumbers(latex, "6")).toBe(false);
  });
});

describe("compareNumbersByValue", () => {
  const byValue = { mode: "literal" as const, literal: { compareNumbersByValue: true } };

  it("is off by default, so literal still tells number forms apart", () => {
    expect(latexEqual("4/6", "2/3", { mode: "literal" })).toBe(false);
    expect(latexEqual("4/6", "2/3", byValue)).toBe(true);
  });

  it("applies to literal only", () => {
    expect(latexEqual("3+3", "6", { mode: "symbolic", literal: { compareNumbersByValue: true } })).toBe(true);
  });

  it("leaves symbolic and literal mixed numbers as sums", () => {
    expect(latexEqual("2\\frac{1}{2}", "2+\\frac{1}{2}", { mode: "symbolic" })).toBe(true);
    expect(latexEqual("2\\frac{1}{2}", "2+\\frac{1}{2}", { mode: "literal" })).toBe(true);
    expect(latexEqual("2\\frac{1}{2}", "2+\\frac{1}{2}", byValue)).toBe(false);
  });
});
