# @pie-framework/math-validation

Decides whether two LaTeX expressions are equal, literally or symbolically. The math-inline and math-templated controllers score responses with it.

```ts
import { latexEqual } from '@pie-framework/math-validation';

latexEqual('\\frac{4}{6}', '\\frac{2}{3}', { mode: 'symbolic' }); // true
latexEqual('a+7+b', '7+a+b', { mode: 'literal', literal: { ignoreOrder: true } }); // true
```

The package is ES modules only. LaTeX is parsed into an AST (`src/conversion/latex-to-ast.ts`), converted to a mathjs expression tree (`src/conversion/ast-to-mathjs.ts`), and compared there. Both converters derive from the math-expressions library and are used under its Apache-2.0 license; `LICENSE` holds the terms.

## Input

Both modes read `\dfrac` and `\tfrac` as `\frac`, and `,`, `{,}` or `\,` between groups of three digits as a thousands separator, so `1{,}000` is `1000`; any other comma separates list items, as does the Arabic comma `،`. A whole number before a fraction is a mixed number, also with a spacing command between them when the fraction is numeric (`2\ \frac{1}{2}`). Variables are single Latin or Arabic letters, and `\text{}` takes letters of any script. Digits are ASCII only: math-inline and math-templated fold other digit systems and the Arabic decimal and thousands marks before they compare.

## Modes

**Literal** compares the form of the expressions. It ignores spaces and parentheses that do not change the meaning, so `a+7 +b` matches `((a) + (7))+b`, and it ignores leading zeros (`0.1` matches `.1`) and thousands separators (`1,000` matches `1000`). Three options under `literal` widen it:

- `allowTrailingZeros`: `4.5` matches `4.50000`.
- `ignoreOrder`: the order of terms and factors stops mattering, so `a+7+b*c` matches `7+a+bc`, though not `ac+7+b`.
- `compareNumbersByValue`: a single number matches only a single number of equal value. A number is an integer, decimal, fraction (`\frac{2}{3}` or `2/3`) or mixed number (`2\frac{1}{2}`), with at most one sign and optionally in parentheses. `4/6` matches `2/3` and `2.5` matches `2\frac{1}{2}`, but `3+3` does not match `6`: any operation, constant (`\pi`), unit or percentage makes a side a non-number. When neither side is a number, the literal comparison decides. Values are exact, so `0.1` does not match `0.10000000000000001`.

**Symbolic** decides mathematical equivalence. It normalises both sides (distributing coefficients, combining like terms, sorting) and, where that is not enough, solves or samples them. It takes no options; the literal options do not apply to it. It handles:

- linear equations in one or two variables, and quadratic equations
- two-way inequalities in one or two variables, and compound inequalities in one variable
- trigonometric and inverse trigonometric functions and identities, with angles in radians or in degrees written `°` or `\degree`
- the product, quotient and power rules for logarithms, and `\log` as `\log_{10}`

## Demo

```shell
bun run demo
```

Serves a page that compares two expressions in either mode; the URL records the comparison, so it can be shared. `bun run build:demo` type-checks the page and writes it to `demo/dist`.

## Tests

```shell
bun run test
```

`src/__tests__/latex-equal.test.ts` runs the fixtures under `src/fixtures/latex-equal/literal` and `src/fixtures/latex-equal/symbolic`, one suite per fixture file named by its path. Narrow a run with Vitest's `-t` filter:

```shell
bunx vitest run src/__tests__/latex-equal.test.ts -t src/fixtures/latex-equal/literal/PD-303.ts
```

To debug in VS Code, add an attach configuration to `launch.json`:

```json
{
  "name": "Attach",
  "port": 9229,
  "request": "attach",
  "skipFiles": ["<node_internals>/**"],
  "type": "node"
}
```

Start the tests with `bunx vitest run --inspect-brk --no-file-parallelism`, then run the Attach configuration.

## Release

The package builds, tests and releases with the rest of [pie-elements-ng](https://github.com/pie-framework/pie-elements-ng); see `docs/PUBLISHING.md` there.
