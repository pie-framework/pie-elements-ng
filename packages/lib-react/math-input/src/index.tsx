// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/index.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { keysForGrade } from './keys/grades';
import { updateSpans } from './updateSpans';
import * as keys from './keys';
import MathQuill from '@pie-framework/mathquill';

import HorizontalKeypad from './horizontal-keypad';

import * as mq from './mq';

const addLeftBracket = (s) => (s.indexOf('\\(') === 0 ? s : `\\(${s}`);
const addRightBracket = (s) => (s.indexOf('\\)') === s.length - 2 ? s : `${s}\\)`);
const rmLeftBracket = (s) => (s.indexOf('\\(') === 0 ? s.substring(2) : s);
const rmRightBracket = (s) => (s.indexOf('\\)') === s.length - 2 ? s.substring(0, s.length - 2) : s);

const addBrackets = (s) => addRightBracket(addLeftBracket(s));
const removeBrackets = (s) => rmRightBracket(rmLeftBracket(s));

const getMathQuillInterface = () => {
  if (typeof window === 'undefined') return null;
  return MathQuill.getInterface(2);
};

const registerEmbed = (name, factory) => {
  const MQ = getMathQuillInterface();
  if (MQ?.registerEmbed) {
    MQ.registerEmbed(name, factory);
  }
};

const applyStaticMath = (element, latex = '') => {
  const MQ = getMathQuillInterface();
  if (!MQ?.StaticMath || !element) return null;

  element.textContent = '';
  const staticMath = MQ.StaticMath(element);
  if (typeof staticMath?.latex === 'function') {
    staticMath.latex(latex);
  }
  updateSpans(element);
  return staticMath;
};

export {
  keysForGrade,
  addBrackets,
  removeBrackets,
  keys,
  HorizontalKeypad,
  mq,
  updateSpans,
  registerEmbed,
  applyStaticMath,
};
