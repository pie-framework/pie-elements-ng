import { all, create, MathJsStatic } from 'mathjs';

// @types/mathjs types `create` as returning a Partial; `all` loads every function.
export const mathjs = create(all, { number: 'Fraction' }) as MathJsStatic & {
  replacer: (key: string, value: unknown) => unknown;
};
export const { parse } = mathjs;

export const replacer = mathjs.replacer;
