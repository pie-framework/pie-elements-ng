import { all, create, type MathJsStatic, type MathNode } from 'mathjs';

// mathjs types `create` as returning a Partial; `all` loads every function.
export const mathjs = create(all, { number: 'Fraction' }) as MathJsStatic & {
  replacer: (key: string, value: unknown) => unknown;
};
export const { parse } = mathjs;

// A node of any type, with the fields of every node type optional. mathjs 9 typed MathNode this way, and this
// package reads and rewrites nodes without narrowing them first.
export type ExpressionNode = MathNode & {
  isAccessorNode?: boolean;
  isArrayNode?: boolean;
  isConstantNode?: boolean;
  isFunctionNode?: boolean;
  isOperatorNode?: boolean;
  isParenthesisNode?: boolean;
  isRelationalNode?: boolean;
  isSymbolNode?: boolean;
  args?: ExpressionNode[];
  content?: ExpressionNode;
  fn?: string;
  name?: string;
  op?: string;
  value?: any;
};

export const replacer = mathjs.replacer;

// Plain floating-point instance, for values a Fraction cannot hold, such as pi or sample-point evaluations.
export const numeric = create(all) as MathJsStatic;

// ast-to-mathjs writes a number with trailing zeros, such as 1.50, as tzn(1.5, 1);
// this rule drops the trailing zeros.
export const TRAILING_ZEROS_RULE = Object.freeze({ l: 'tzn(n1, n2)', r: 'n1' });
