// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/index.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { keysForGrade } from './keys/grades.js';
import { updateSpans } from './updateSpans.js';
import * as keys from './keys/index.js';

import HorizontalKeypad from './horizontal-keypad.js';

import * as mq from './mq/index.js';

const addLeftBracket = (s) => (s.indexOf('\\(') === 0 ? s : `\\(${s}`);
const addRightBracket = (s) => (s.indexOf('\\)') === s.length - 2 ? s : `${s}\\)`);
const rmLeftBracket = (s) => (s.indexOf('\\(') === 0 ? s.substring(2) : s);
const rmRightBracket = (s) => (s.indexOf('\\)') === s.length - 2 ? s.substring(0, s.length - 2) : s);

const addBrackets = (s) => addRightBracket(addLeftBracket(s));
const removeBrackets = (s) => rmRightBracket(rmLeftBracket(s));

export { keysForGrade, addBrackets, removeBrackets, keys, HorizontalKeypad, mq, updateSpans };
