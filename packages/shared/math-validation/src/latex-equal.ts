import { LatexToAst } from './conversion/latex-to-ast.js';
import { AstToMathJs } from './conversion/ast-to-mathjs.js';
import { isMathEqual as isSymbolicEqual } from './symbolic/index.js';
import { isMathEqual as isLiteralEqual } from './literal/index.js';
import { differenceIsTooGreat } from './difference.js';
import { compareNumbers } from './value.js';

import type { Latex, Opts } from './options.js';

const lta = new LatexToAst();
const atm = new AstToMathJs();

export const latexEqual = (a: Latex, b: Latex, opts: Opts): boolean => {
  const isNumeric = (str: string): boolean => /^\s*-?\d+(\.\d+)?\s*$/.test(str);

  if (!a || !b) {
    return false;
  }

  if (a === b) {
    return true;
  }

  if (opts.mode === 'literal' && opts.literal?.compareNumbersByValue) {
    const byValue = compareNumbers(a, b);
    if (byValue !== undefined) {
      return byValue;
    }
  }

  if (opts.mode === 'symbolic' && isNumeric(a) && isNumeric(b)) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);

    if (numA === numB) {
      return true;
    }
  }

  const al = lta.convert(a);
  const bl = lta.convert(b);

  if (differenceIsTooGreat(al, bl)) {
    return false;
  }

  const amo = atm.convert(al);

  const bmo = atm.convert(bl);

  if (opts.mode === 'literal') {
    return isLiteralEqual(amo, bmo, opts.literal);
  } else {
    return isSymbolicEqual(amo, bmo);
  }
};
