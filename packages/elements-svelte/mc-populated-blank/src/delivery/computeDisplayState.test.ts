/**
 * Unit tests for computeDisplayState.
 *
 * computeFeatureAudioSkin
 *   A1. No locale, no overrides → default English skin
 *   A2. Spanish locale (es-MX) → built-in es skin
 *   A3. Exact locale match in byLocale → that skin
 *   A4. No exact match, lang prefix match (es) → lang skin
 *   A5. byLocale.default when no locale/lang match → byLocale.default skin
 *   A6. customSingle fallback when byLocale empty → customSingle
 *   A7. byLocale.default wins over customSingle
 *
 * computeDisplayChoiceId
 *   D1. Normal gather: returns selectedId
 *   D2. alwaysShowCorrect=true: returns correctChoiceId regardless
 *   D3. alwaysShowCorrect=true, no correctChoiceId: returns selectedId
 *   D4. evaluate + showCorrectAnswer=true: returns correctChoiceId
 *   D5. evaluate + showCorrectAnswer=false: returns selectedId
 *   D6. Not evaluate + showCorrectAnswer=true: returns selectedId (not overridden outside evaluate)
 *
 * computeResultText
 *   R1. Not evaluate mode → empty string
 *   R2. Evaluate + showCorrectAnswer=true → empty string (suppressed while reveal active)
 *   R3. Evaluate + correct → 'Correct answer selected'
 *   R4. Evaluate + incorrect + has selection → 'Incorrect answer selected'
 *   R5. Evaluate + incorrect + no selection → empty string (unanswered, no message)
 *   R6. Evaluate + unanswered (not correct, not incorrect) → empty string
 *
 * computeLegendText
 *   L1. Plain text prompt under limit → prompt text as-is
 *   L2. HTML prompt → tags stripped
 *   L3. Prompt over legendMaxChars → truncated with ellipsis
 *   L4. Empty prompt → answerChoicesLabel fallback
 *   L5. legendMaxChars < 8 → clamped to 8 before truncation
 *   L6. Whitespace-only prompt (after strip) → fallback
 */

import { describe, expect, it } from 'vitest';
import {
  computeFeatureAudioSkin,
  computeDisplayChoiceId,
  computeResultText,
  computeLegendText,
  DEFAULT_AUDIO_BUTTON_SKINS,
} from './computeDisplayState';

const CUSTOM_SKIN = {
  silentUrl: 'https://example.com/s.svg',
  playingUrl: 'https://example.com/p.svg',
};
const BY_LOCALE_SKIN = {
  silentUrl: 'https://example.com/l.svg',
  playingUrl: 'https://example.com/lp.svg',
};

// ---------------------------------------------------------------------------
// computeFeatureAudioSkin
// ---------------------------------------------------------------------------

describe('computeFeatureAudioSkin', () => {
  it('A1: no locale, no overrides → default English skin', () => {
    const result = computeFeatureAudioSkin({
      locale: '',
      audioButtonSkin: null,
      audioButtonSkinsByLocale: {},
    });
    expect(result).toEqual(DEFAULT_AUDIO_BUTTON_SKINS.default);
  });

  it('A2: Spanish locale (es-MX) → built-in es skin', () => {
    const result = computeFeatureAudioSkin({
      locale: 'es-MX',
      audioButtonSkin: null,
      audioButtonSkinsByLocale: {},
    });
    expect(result).toEqual(DEFAULT_AUDIO_BUTTON_SKINS.es);
  });

  it('A3: exact locale match in byLocale → that skin', () => {
    const result = computeFeatureAudioSkin({
      locale: 'fr-CA',
      audioButtonSkin: null,
      audioButtonSkinsByLocale: { 'fr-ca': BY_LOCALE_SKIN },
    });
    expect(result).toEqual(BY_LOCALE_SKIN);
  });

  it('A4: no exact match, lang prefix match → lang skin', () => {
    const frSkin = { silentUrl: 'fr-s', playingUrl: 'fr-p' };
    const result = computeFeatureAudioSkin({
      locale: 'fr-CA',
      audioButtonSkin: null,
      audioButtonSkinsByLocale: { fr: frSkin },
    });
    expect(result).toEqual(frSkin);
  });

  it('A5: byLocale.default when no locale/lang match → byLocale.default', () => {
    const defaultOverride = { silentUrl: 'def-s', playingUrl: 'def-p' };
    const result = computeFeatureAudioSkin({
      locale: 'de',
      audioButtonSkin: null,
      audioButtonSkinsByLocale: { default: defaultOverride },
    });
    expect(result).toEqual(defaultOverride);
  });

  it('A6: customSingle fallback when byLocale empty', () => {
    const result = computeFeatureAudioSkin({
      locale: '',
      audioButtonSkin: CUSTOM_SKIN,
      audioButtonSkinsByLocale: {},
    });
    expect(result).toEqual(CUSTOM_SKIN);
  });

  it('A7: byLocale.default wins over customSingle', () => {
    const defaultOverride = { silentUrl: 'def-s', playingUrl: 'def-p' };
    const result = computeFeatureAudioSkin({
      locale: '',
      audioButtonSkin: CUSTOM_SKIN,
      audioButtonSkinsByLocale: { default: defaultOverride },
    });
    expect(result).toEqual(defaultOverride);
  });
});

// ---------------------------------------------------------------------------
// computeDisplayChoiceId
// ---------------------------------------------------------------------------

describe('computeDisplayChoiceId', () => {
  const base = {
    selectedId: 'a',
    isEvaluateMode: false,
    showCorrectAnswer: false,
    alwaysShowCorrect: false,
    correctChoiceId: 'b',
  };

  it('D1: gather mode → selectedId', () => {
    expect(computeDisplayChoiceId({ ...base })).toBe('a');
  });

  it('D2: alwaysShowCorrect=true → correctChoiceId', () => {
    expect(computeDisplayChoiceId({ ...base, alwaysShowCorrect: true })).toBe('b');
  });

  it('D3: alwaysShowCorrect=true, no correctChoiceId → selectedId', () => {
    expect(computeDisplayChoiceId({ ...base, alwaysShowCorrect: true, correctChoiceId: '' })).toBe(
      'a'
    );
  });

  it('D4: evaluate + showCorrectAnswer=true → correctChoiceId', () => {
    expect(computeDisplayChoiceId({ ...base, isEvaluateMode: true, showCorrectAnswer: true })).toBe(
      'b'
    );
  });

  it('D5: evaluate + showCorrectAnswer=false → selectedId', () => {
    expect(
      computeDisplayChoiceId({ ...base, isEvaluateMode: true, showCorrectAnswer: false })
    ).toBe('a');
  });

  it('D6: not evaluate + showCorrectAnswer=true → selectedId (not overridden)', () => {
    expect(
      computeDisplayChoiceId({ ...base, isEvaluateMode: false, showCorrectAnswer: true })
    ).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// computeResultText
// ---------------------------------------------------------------------------

describe('computeResultText', () => {
  const base = {
    isEvaluateMode: true,
    showCorrectAnswer: false,
    isCorrect: false,
    isIncorrect: false,
    selectedId: '',
  };

  it('R1: not evaluate mode → empty string', () => {
    expect(computeResultText({ ...base, isEvaluateMode: false })).toBe('');
  });

  it('R2: evaluate + showCorrectAnswer=true → empty string', () => {
    expect(computeResultText({ ...base, isCorrect: true, showCorrectAnswer: true })).toBe('');
  });

  it('R3: evaluate + correct → Correct answer selected', () => {
    expect(computeResultText({ ...base, isCorrect: true })).toBe('Correct answer selected');
  });

  it('R4: evaluate + incorrect + has selection → Incorrect answer selected', () => {
    expect(computeResultText({ ...base, isIncorrect: true, selectedId: 'a' })).toBe(
      'Incorrect answer selected'
    );
  });

  it('R5: evaluate + incorrect + no selection → empty string', () => {
    expect(computeResultText({ ...base, isIncorrect: true, selectedId: '' })).toBe('');
  });

  it('R6: evaluate + unanswered (neither correct nor incorrect) → empty string', () => {
    expect(computeResultText({ ...base })).toBe('');
  });
});

// ---------------------------------------------------------------------------
// computeLegendText
// ---------------------------------------------------------------------------

describe('computeLegendText', () => {
  it('L1: plain text prompt under limit → prompt text', () => {
    expect(
      computeLegendText({
        prompt: 'Choose the word',
        legendMaxChars: 40,
        answerChoicesLabel: 'Choices',
      })
    ).toBe('Choose the word');
  });

  it('L2: HTML prompt → tags stripped', () => {
    expect(
      computeLegendText({
        prompt: '<p><strong>Choose</strong> the word</p>',
        legendMaxChars: 40,
        answerChoicesLabel: 'Choices',
      })
    ).toBe('Choose the word');
  });

  it('L3: prompt over legendMaxChars → truncated with ellipsis', () => {
    const result = computeLegendText({
      prompt: 'Choose the correct spelling',
      legendMaxChars: 10,
      answerChoicesLabel: 'Choices',
    });
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.endsWith('…')).toBe(true);
  });

  it('L4: empty prompt → answerChoicesLabel fallback', () => {
    expect(
      computeLegendText({ prompt: '', legendMaxChars: 40, answerChoicesLabel: 'Answer choices' })
    ).toBe('Answer choices');
  });

  it('L5: legendMaxChars below 8 → clamped, no crash', () => {
    const result = computeLegendText({
      prompt: 'Hi there friend',
      legendMaxChars: 2,
      answerChoicesLabel: 'Choices',
    });
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('L6: whitespace-only HTML prompt → fallback', () => {
    expect(
      computeLegendText({
        prompt: '<p>   </p>',
        legendMaxChars: 40,
        answerChoicesLabel: 'Answer choices',
      })
    ).toBe('Answer choices');
  });
});
