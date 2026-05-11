import { describe, expect, it } from 'vitest';
import { computeLayoutStyle, DEFAULT_LAYOUT_LIMITS } from './computeLayoutStyle';

const NO_CORRECT_ANSWER_VARS = '';
const base = {
  configuredLimits: {},
  customProfilePresets: {},
  correctAnswerStyleVars: NO_CORRECT_ANSWER_VARS,
};

// ---------------------------------------------------------------------------
// blankWidth
// ---------------------------------------------------------------------------
describe('blankWidth', () => {
  it('audio_blank_only → blankWideWidthRem', () => {
    const { blankWidth } = computeLayoutStyle({
      ...base,
      layoutProfile: 'audio_blank_only',
      isBlankOnlyTemplate: false,
    });
    expect(blankWidth).toBe(`${DEFAULT_LAYOUT_LIMITS.blankWideWidthRem}rem`);
  });

  it('stimulus_image_blank → blankWideWidthRem', () => {
    const { blankWidth } = computeLayoutStyle({
      ...base,
      layoutProfile: 'stimulus_image_blank',
      isBlankOnlyTemplate: false,
    });
    expect(blankWidth).toBe(`${DEFAULT_LAYOUT_LIMITS.blankWideWidthRem}rem`);
  });

  it('other profile + isBlankOnlyTemplate → blankStandaloneWidthRem', () => {
    const { blankWidth } = computeLayoutStyle({
      ...base,
      layoutProfile: 'token_sequence',
      isBlankOnlyTemplate: true,
    });
    expect(blankWidth).toBe(`${DEFAULT_LAYOUT_LIMITS.blankStandaloneWidthRem}rem`);
  });

  it('other profile + not blank-only → auto', () => {
    const { blankWidth } = computeLayoutStyle({
      ...base,
      layoutProfile: 'inline_sentence',
      isBlankOnlyTemplate: false,
    });
    expect(blankWidth).toBe('auto');
  });
});

// ---------------------------------------------------------------------------
// blankBorderWidth
// ---------------------------------------------------------------------------
describe('blankBorderWidth', () => {
  it.each([
    'audio_blank_only',
    'stimulus_image_blank',
    'token_sequence',
  ])('%s → blankUnderlineWideWidthPx (profile preset overrides to 6)', (profile) => {
    const { blankBorderWidth } = computeLayoutStyle({
      ...base,
      layoutProfile: profile,
      isBlankOnlyTemplate: false,
    });
    // All three wide-underline profiles have preset blankUnderlineWideWidthPx: 6
    expect(blankBorderWidth).toBe('6px');
  });

  it('other profile → blankUnderlineWidthPx (default 2)', () => {
    const { blankBorderWidth } = computeLayoutStyle({
      ...base,
      layoutProfile: 'inline_sentence',
      isBlankOnlyTemplate: false,
    });
    expect(blankBorderWidth).toBe(`${DEFAULT_LAYOUT_LIMITS.blankUnderlineWidthPx}px`);
  });
});

// ---------------------------------------------------------------------------
// legendMaxChars — uses resolved limits so overrides are respected
// ---------------------------------------------------------------------------
describe('legendMaxChars', () => {
  it('defaults to DEFAULT_LAYOUT_LIMITS.legendMaxChars', () => {
    const { legendMaxChars } = computeLayoutStyle({
      ...base,
      layoutProfile: '',
      isBlankOnlyTemplate: false,
    });
    expect(legendMaxChars).toBe(DEFAULT_LAYOUT_LIMITS.legendMaxChars);
  });

  it('configuredLimits override is respected', () => {
    const { legendMaxChars } = computeLayoutStyle({
      ...base,
      layoutProfile: '',
      isBlankOnlyTemplate: false,
      configuredLimits: { legendMaxChars: 60 },
    });
    expect(legendMaxChars).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// limit resolution order: defaults < configuredLimits < profile preset < custom preset
// ---------------------------------------------------------------------------
describe('limit resolution order', () => {
  it('profile preset overrides configuredLimits', () => {
    // audio_blank_only preset sets choiceGroupGapRem: 1; configured sets it to 0.1
    const { rootStyle } = computeLayoutStyle({
      ...base,
      layoutProfile: 'audio_blank_only',
      isBlankOnlyTemplate: false,
      configuredLimits: { choiceGroupGapRem: 0.1 },
    });
    expect(rootStyle).toContain('--mpb-choice-group-gap:1rem');
  });

  it('customProfilePresets override the built-in profile preset', () => {
    const { rootStyle } = computeLayoutStyle({
      ...base,
      layoutProfile: 'audio_blank_only',
      isBlankOnlyTemplate: false,
      customProfilePresets: { audio_blank_only: { choiceGroupGapRem: 2 } },
    });
    expect(rootStyle).toContain('--mpb-choice-group-gap:2rem');
  });

  it('ignores customProfilePresets for a different profile', () => {
    const { rootStyle } = computeLayoutStyle({
      ...base,
      layoutProfile: 'audio_blank_only',
      isBlankOnlyTemplate: false,
      customProfilePresets: { token_sequence: { choiceGroupGapRem: 99 } },
    });
    // audio_blank_only preset value (1) should win, not 99
    expect(rootStyle).toContain('--mpb-choice-group-gap:1rem');
  });
});

// ---------------------------------------------------------------------------
// rootStyle contains all expected CSS var groups
// ---------------------------------------------------------------------------
describe('rootStyle structure', () => {
  it('includes blank, choice, audio, and grid vars', () => {
    const { rootStyle } = computeLayoutStyle({
      ...base,
      layoutProfile: '',
      isBlankOnlyTemplate: false,
    });
    expect(rootStyle).toContain('--mpb-blank-standalone-width:');
    expect(rootStyle).toContain('--mpb-choice-width-px:');
    expect(rootStyle).toContain('--mpb-listen-button-size:');
    expect(rootStyle).toContain('--mpb-stimulus-grid-column-gap:');
    expect(rootStyle).toContain('--mpb-token-grid-column-gap:');
    expect(rootStyle).toContain('--mpb-inline-grid-column-gap:');
  });

  it('appends correctAnswerStyleVars at the end', () => {
    const { rootStyle } = computeLayoutStyle({
      ...base,
      layoutProfile: '',
      isBlankOnlyTemplate: false,
      correctAnswerStyleVars: '--pie-foo:bar',
    });
    expect(rootStyle).toMatch(/--pie-foo:bar$/);
  });
});
