// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/mq/mathquill-instance.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import MathQuill from '@pie-framework/mathquill';
import { registerLineBreak } from './custom-elements.js';

let MQ;
if (typeof window !== 'undefined') {
  MQ = MathQuill.getInterface(3);
  if (MQ && MQ.registerEmbed) {
    registerLineBreak(MQ);
  }
}

/**
 * Register a MathQuill embed (e.g. answer blocks in pie-elements).
 * No-op in SSR or if the interface is unavailable.
 *
 * @param {string} name
 * @param {Function} factory
 */
export function registerEmbed(name, factory) {
  if (!MQ || !MQ.registerEmbed) {
    return;
  }
  MQ.registerEmbed(name, factory);
}

/**
 * Apply MathQuill static math to a DOM element.
 * Optionally sets element text to `latex` before enhancing (typical pie-elements usage).
 *
 * @param {HTMLElement} element
 * @param {string} [latex] If provided, assigned to element.textContent before StaticMath runs.
 * @param {object} [options] Optional MathQuill StaticMath options (e.g. handlers).
 * @returns {object|undefined} MathQuill static math instance, if any.
 */
export function applyStaticMath(element, latex, options) {
  if (!MQ || !element) {
    return undefined;
  }
  if (latex !== undefined && latex !== null) {
    element.textContent = latex;
  }
  return MQ.StaticMath(element, options);
}

export { MQ };
