// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import digits from './digits';
import * as nav from './navigation';
import * as edit from './edit';
import { divide, multiply, plus, minus, equals } from './basic-operators';

const { one, two, three, four, five, six, seven, eight, nine, zero, comma, decimalPoint } = digits;

export const baseSet = [
  [seven, eight, nine, divide],
  [four, five, six, multiply],
  [one, two, three, minus],
  [zero, decimalPoint, comma, plus],
  [nav.left, nav.right, edit.del, equals],
];

import * as comparison from './comparison';
import * as fractions from './fractions';
import * as exponent from './exponent';
import * as misc from './misc';

export { comparison, fractions, exponent, misc };
