import { describe, expect, it } from 'vitest';
import { fromMathLive } from '@pie-lib/math-input-mathlive';
import { outcome } from '../src/controller/index.js';

/**
 * An answer typed in the MathLive editor must score as the same answer did when
 * MathQuill stored it (PIE-1514).
 *
 * Each pair is [what MathQuill stored, what MathLive 0.110 serialises for the
 * same content once it is typed or edited]. The second column was recorded in
 * Chrome through the editor's own path (`toMathLive` -> `<math-field>.value` ->
 * `getValue`): MathLive drops the braces around single-digit arguments, which the
 * scorer does not parse. A real `<math-field>` does not run under happy-dom, so
 * the serialisations are recorded rather than produced here; re-record them when
 * MathLive is upgraded.
 *
 * The keys include production answers (`\frac{3}{7}`, `9\frac{3}{4}`) whose items
 * accept a fraction only.
 */
const TYPED: Array<[string, string]> = [
  ['\\frac{1}{2}', '\\frac12'],
  ['2\\frac{1}{2}', '2\\frac12'],
  ['\\frac{3}{7}', '\\frac37'],
  ['9\\frac{3}{4}', '9\\frac34'],
  ['\\frac{1}{2}x', '\\frac12x'],
  ['x^{\\frac{1}{2}}', 'x^{\\frac12}'],
  ['\\sqrt{2}', '\\sqrt2'],
  ['\\frac{a}{\\sqrt{2}}', '\\frac{a}{\\sqrt2}'],
  ['\\frac{\\sqrt{3}}{2}', '\\frac{\\sqrt3}{2}'],
  ['\\sqrt{\\frac{1}{4}}', '\\sqrt{\\frac14}'],
];

const EVALUATE = { mode: 'evaluate' } as const;

const simple = (answer: string, validation: string) =>
  ({ responseType: 'Simple', responses: [{ id: '1', answer, validation, alternates: {} }] }) as any;

const score = async (question: any, session: Record<string, string>) =>
  (await outcome(question, { id: '1', ...session } as any, EVALUATE as any)).score;

describe('answers typed in MathLive score as their MathQuill form', () => {
  describe.each(['literal', 'symbolic'])('%s validation', (validation) => {
    it.each(TYPED)('a student typing %s', async (stored, typed) => {
      expect(await score(simple(stored, validation), { response: fromMathLive(typed) })).toBe(1);
    });

    it.each(TYPED)('an author typing %s as the key', async (stored, typed) => {
      expect(await score(simple(fromMathLive(typed), validation), { response: stored })).toBe(1);
    });
  });

  it('accepts a decimal for a fraction typed with the fraction key (symbolic)', async () => {
    expect(await score(simple('0.5', 'symbolic'), { response: fromMathLive('\\frac12') })).toBe(1);
    expect(await score(simple(fromMathLive('\\frac12'), 'symbolic'), { response: '0.5' })).toBe(1);
  });
});
