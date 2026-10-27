/**
 * Direction of a run of text from its script, as the Unicode bidi algorithm's rule P2 finds it: the
 * first strong character decides. Letters of Hebrew, Arabic, Syriac, Thaana, NKo and the other RTL
 * scripts are strong right-to-left, every other letter strong left-to-right, and the explicit marks
 * count as what they mark. Digits (Arabic-Indic ones included), punctuation, symbols and combining
 * marks are weak or neutral and are skipped.
 */

export type TextDirection = 'ltr' | 'rtl';

const RTL_BLOCK = /[֐-ࣿיִ-﷿ﹰ-ﻼ\u{10800}-\u{10FFF}\u{1E800}-\u{1EFFF}]/u;
const LETTER = /\p{L}/u;
const RTL_MARKS = new Set(['‏', '؜']);
const LTR_MARK = '‎';

/** The direction of the first strong character in `text`, or `undefined` when it has none. */
export function detectScriptDirection(text: string | null | undefined): TextDirection | undefined {
  if (!text) return undefined;
  for (const char of text) {
    if (RTL_MARKS.has(char)) return 'rtl';
    if (char === LTR_MARK) return 'ltr';
    if (LETTER.test(char)) return RTL_BLOCK.test(char) ? 'rtl' : 'ltr';
  }
  return undefined;
}
