/**
 * The status colours a page renders with no theme loaded: each `color.*` chain ends in a
 * `defaults` literal, and those literals carry the contrast.
 */
import { describe, expect, it } from 'vitest';
import {
  backgroundDark,
  correct,
  correctSecondary,
  defaults,
  incorrect,
  incorrectSecondary,
  missing,
  text,
} from '../src/color';
import { channels, contrast } from './contrast';

const WHITE = channels(defaults.WHITE);

describe('status colour fallbacks', () => {
  it.each([
    ['correct', correct, 'var(--pie-correct, #208537)'],
    ['incorrect', incorrect, 'var(--pie-incorrect, #a65f00)'],
    ['missing', missing, 'var(--pie-missing, #d32f2f)'],
  ])('%s reads its token and falls back to its default', (_, chain, css) => {
    expect(chain()).toBe(css);
  });

  // Blank and response-box borders, correctness text, and white-glyph badges all read these.
  it.each([
    ['CORRECT', defaults.CORRECT],
    ['INCORRECT', defaults.INCORRECT],
    ['MISSING', defaults.MISSING],
  ])('%s holds 4.5:1 against white', (_, literal) => {
    expect(contrast(channels(literal), WHITE)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Feedback colours with no theme loaded', () => {
  it.each([
    ['correct', correctSecondary, defaults.CORRECT_SECONDARY],
    ['incorrect', incorrectSecondary, defaults.INCORRECT_SECONDARY],
    ['other', backgroundDark, defaults.BACKGROUND_DARK],
  ])('keeps the page ink at 4.5:1 on the %s fill', (_, fill, literal) => {
    expect(fill()).toMatch(new RegExp(`, ${literal}\\)$`));
    expect(text()).toBe(`var(--pie-text, ${defaults.TEXT})`);
    expect(contrast(channels(defaults.TEXT), channels(literal))).toBeGreaterThanOrEqual(4.5);
  });
});
