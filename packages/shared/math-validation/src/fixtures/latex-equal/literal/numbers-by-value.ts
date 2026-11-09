const opts = { literal: { compareNumbersByValue: true } };

export default {
  mode: "literal",
  tests: [
    {
      target: "6",
      eq: ["6", "+6", "(6)", "\\left(6\\right)", "6.0", "6.", "\\frac{12}{2}", "12/2", "\\frac{12}{2.0}"],
      ne: ["3+3", "2\\cdot3", "6x", "-6", "60", "\\sqrt{36}", "6\\%", "6cm"],
    },
    {
      target: "-6",
      eq: ["-6", "−6", "(-6)", "-(6)", "\\frac{-12}{2}", "\\frac{12}{-2}", "-\\frac{12}{2}"],
      ne: ["6", "--6", "0-6", "-3-3"],
    },
    {
      target: "\\frac{2}{3}",
      eq: ["2/3", "\\frac{4}{6}", "(2/3)"],
      ne: ["0.67", "0.6666666666666666", "\\frac{3}{2}", "\\frac{1}{3}+\\frac{1}{3}", "\\frac{\\frac{4}{3}}{2}"],
    },
    {
      label: "mixed number",
      target: "2\\frac{1}{2}",
      eq: ["2\\frac{1}{2}", "2 \\frac{1}{2}", "2.5", "\\frac{5}{2}", "5/2"],
      ne: ["2+\\frac{1}{2}", "2\\cdot\\frac{1}{2}", "2\\frac{-1}{2}", "1"],
    },
    {
      target: "-2\\frac{1}{2}",
      eq: ["-2.5", "-\\frac{5}{2}"],
      ne: ["2.5", "-2+\\frac{1}{2}"],
    },
    {
      target: "0.5",
      eq: [".5", "0.50", "\\frac{1}{2}", "\\frac{1.5}{3}"],
      ne: ["0.55", "\\frac{1}{0}"],
    },
    {
      target: "1000",
      eq: ["1,000", "1000.0"],
      ne: ["1{,}000", "1,5", "10^3"],
    },
    {
      target: "0",
      eq: ["-0", "0.0", "\\frac{0}{5}"],
      ne: ["\\frac{0}{0}"],
    },
    {
      label: "an expression key compares as literal",
      target: "3+3",
      eq: ["3+3", "3 + 3"],
      ne: ["6", "3+4"],
    },
    { target: "2x", eq: ["2x"], ne: ["x+x", "\\frac{4}{2}x"] },
    { target: "x+1", opts: { literal: { compareNumbersByValue: true, ignoreOrder: true } }, eq: ["1+x"], ne: ["x+2"] },
    { target: "50\\%", eq: ["50\\%"], ne: ["0.5"] },
    { target: "\\pi", eq: ["\\pi"], ne: ["3.14"] },
    { target: "\\sqrt{4}", eq: ["\\sqrt{4}"], ne: ["2"] },
  ].map((test) => ({ opts, ...test })),
};
