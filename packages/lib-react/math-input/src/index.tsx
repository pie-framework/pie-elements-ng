// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/index.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { keysForGrade } from './keys/grades';
import { updateSpans } from './updateSpans';

const addLeftBracket = (s) => (s.indexOf('\\(') === 0 ? s : `\\(${s}`);
const addRightBracket = (s) => (s.indexOf('\\)') === s.length - 2 ? s : `${s}\\)`);
const rmLeftBracket = (s) => (s.indexOf('\\(') === 0 ? s.substring(2) : s);
const rmRightBracket = (s) => (s.indexOf('\\)') === s.length - 2 ? s.substring(0, s.length - 2) : s);

const addBrackets = (s) => addRightBracket(addLeftBracket(s));
const removeBrackets = (s) => rmRightBracket(rmLeftBracket(s));

import * as keys from './keys';

import HorizontalKeypad from './horizontal-keypad';

import * as mq from './mq';

export { keysForGrade, addBrackets, removeBrackets, keys, HorizontalKeypad, mq, updateSpans };
