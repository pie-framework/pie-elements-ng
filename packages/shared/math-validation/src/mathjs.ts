import { all, create, type MathJsStatic } from 'mathjs';

// @types/mathjs types `create` as returning a Partial; `all` loads every function.
export const mathjs = create(all, { number: 'Fraction' }) as MathJsStatic & {
  replacer: (key: string, value: unknown) => unknown;
};
export const { parse } = mathjs;

export const replacer = mathjs.replacer;

// Plain floating-point instance, for values a Fraction cannot hold, such as pi or sample-point evaluations.
export const numeric = create(all) as MathJsStatic;

// ast-to-mathjs writes a number with trailing zeros, such as 1.50, as tzn(1.5, 1);
// this rule drops the trailing zeros.
export const TRAILING_ZEROS_RULE = Object.freeze({ l: 'tzn(n1, n2)', r: 'n1' });
