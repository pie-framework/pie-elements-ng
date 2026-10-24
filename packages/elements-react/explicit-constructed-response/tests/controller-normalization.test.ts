// Controllers also run server-side, so these run without a DOM.
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getScore, outcome } from '../src/controller/index.js';

const model = (label: string, language?: string) => ({
  markup: '<p>{{0}}</p>',
  choices: { 0: [{ label, value: '0' }] },
  ...(language ? { language } : {}),
});

const session = (typed: string) => ({ id: '1', value: { 0: typed } });

describe('response normalization', () => {
  it('scores a response typed in another digit system against an ASCII label', () => {
    for (const typed of ['١٢', '۱۲', '१२']) {
      expect(getScore(model('12'), session(typed)), typed).toBe(1);
    }
  });

  it('reads the Arabic decimal separator with the content language’s decimal mark', () => {
    expect(getScore(model('3.5'), session('٣٫٥'))).toBe(1);
    expect(getScore(model('3,5', 'de_DE'), session('٣٫٥'))).toBe(1);
    expect(getScore(model('3,5'), session('٣٫٥'), { locale: 'ar-MA' })).toBe(1);
  });

  it('keeps ASCII comparison exact', () => {
    expect(getScore(model('Paris'), session('Paris'))).toBe(1);
    expect(getScore(model('Paris'), session('paris'))).toBe(0);
    expect(getScore(model('3.5'), session('3,5'))).toBe(0);
  });

  it('scores the outcome with the normalized comparison', async () => {
    const result = await outcome(model('12') as any, session('١٢') as any, { mode: 'evaluate' });
    expect(result.score).toBe(1);
  });
});
