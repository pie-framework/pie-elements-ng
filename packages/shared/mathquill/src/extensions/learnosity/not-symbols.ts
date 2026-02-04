/**
 * Not-less and Not-greater Symbols (Learnosity)
 *
 * Source: Learnosity/mathquill@master
 * File: src/mathquill.js
 *
 * Adds ≮ (not less than) and ≯ (not greater than) symbols
 * These are commonly used in mathematics education.
 *
 * Usage:
 * - \nless produces ≮ (not less than) U+226E
 * - \ngtr produces ≯ (not greater than) U+226F
 */

import type { MathQuillInterface } from 'mathquill';

export function addNotSymbols(MQ: MathQuillInterface): void {
  const mqInternal = MQ as any;

  if (!mqInternal.L?.LatexCmds) {
    console.warn('MathQuill internals not accessible for not-symbols');
    return;
  }

  const { LatexCmds, CharCmds, bindVanillaSymbol } = mqInternal.L;

  if (!bindVanillaSymbol) {
    console.warn('bindVanillaSymbol not available');
    return;
  }

  // Add nless (not less than) symbol: ≮
  if (!LatexCmds.nless) {
    LatexCmds.nless = bindVanillaSymbol('\\nless', '≮', 'not less than');
  }

  // Add ngtr (not greater than) symbol: ≯
  if (!LatexCmds.ngtr) {
    LatexCmds.ngtr = bindVanillaSymbol('\\ngtr', '≯', 'not greater than');
  }

  // Also register Unicode variants for direct input
  if (!CharCmds['≮']) {
    CharCmds['≮'] = LatexCmds.nless;
  }

  if (!CharCmds['≯']) {
    CharCmds['≯'] = LatexCmds.ngtr;
  }
}
