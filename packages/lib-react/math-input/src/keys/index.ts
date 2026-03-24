// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import digits from './digits.js';
import * as nav from './navigation.js';
import * as edit from './edit.js';
import { divide, equals, minus, multiply, plus } from './basic-operators.js';
import * as comparison from './comparison.js';
import * as fractions from './fractions.js';
import * as exponent from './exponent.js';
import * as misc from './misc.js';

const { one, two, three, four, five, six, seven, eight, nine, zero, comma, decimalPoint } = digits;

export const baseSet = [
  [seven, eight, nine, divide],
  [four, five, six, multiply],
  [one, two, three, minus],
  [zero, decimalPoint, comma, plus],
  [nav.left, nav.right, edit.del, equals],
];

export { comparison, fractions, exponent, misc };
