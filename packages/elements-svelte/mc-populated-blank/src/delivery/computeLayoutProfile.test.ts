import { describe, it, expect } from 'vitest';
import { computeLayoutProfile } from './computeLayoutProfile';

describe('computeLayoutProfile — isAudioOnlyMode', () => {
  it('is true when interactionMode is audio_mc_only', () => {
    const { isAudioOnlyMode } = computeLayoutProfile({ interactionMode: 'audio_mc_only' });
    expect(isAudioOnlyMode).toBe(true);
  });

  it('is false for any other interactionMode', () => {
    expect(computeLayoutProfile({ interactionMode: 'populate_blank' }).isAudioOnlyMode).toBe(false);
    expect(computeLayoutProfile({ interactionMode: '' }).isAudioOnlyMode).toBe(false);
    expect(computeLayoutProfile({}).isAudioOnlyMode).toBe(false);
  });
});

describe('computeLayoutProfile — isBlankOnlyTemplate', () => {
  it('is true when template contains only the blank token', () => {
    expect(computeLayoutProfile({ template: '{{blank}}' }).isBlankOnlyTemplate).toBe(true);
  });

  it('is true when blank token is wrapped in HTML tags', () => {
    expect(computeLayoutProfile({ template: '<p>{{blank}}</p>' }).isBlankOnlyTemplate).toBe(true);
  });

  it('is true when blank token is surrounded by whitespace after stripping', () => {
    expect(computeLayoutProfile({ template: '  <p>  {{blank}}  </p>  ' }).isBlankOnlyTemplate).toBe(
      true
    );
  });

  it('is true when template contains &nbsp; around the token', () => {
    expect(computeLayoutProfile({ template: '&nbsp;{{blank}}&nbsp;' }).isBlankOnlyTemplate).toBe(
      true
    );
  });

  it('is false when template has text before the blank token', () => {
    expect(computeLayoutProfile({ template: 'The word is {{blank}}.' }).isBlankOnlyTemplate).toBe(
      false
    );
  });

  it('is false when template has text after the blank token', () => {
    expect(
      computeLayoutProfile({ template: '<p>{{blank}} is the answer.</p>' }).isBlankOnlyTemplate
    ).toBe(false);
  });

  it('is false for empty template', () => {
    expect(computeLayoutProfile({ template: '' }).isBlankOnlyTemplate).toBe(false);
    expect(computeLayoutProfile({}).isBlankOnlyTemplate).toBe(false);
  });
});

describe('computeLayoutProfile — choiceLayout and isHorizontalChoices', () => {
  it('uses configured choiceLayout=horizontal when provided', () => {
    const r = computeLayoutProfile({ choiceLayout: 'horizontal' });
    expect(r.choiceLayout).toBe('horizontal');
    expect(r.isHorizontalChoices).toBe(true);
  });

  it('uses configured choiceLayout=vertical when provided', () => {
    const r = computeLayoutProfile({ choiceLayout: 'vertical' });
    expect(r.choiceLayout).toBe('vertical');
    expect(r.isHorizontalChoices).toBe(false);
  });

  it('defaults to horizontal when isAudioOnlyMode is true and no choiceLayout configured', () => {
    const r = computeLayoutProfile({ interactionMode: 'audio_mc_only' });
    expect(r.choiceLayout).toBe('horizontal');
    expect(r.isHorizontalChoices).toBe(true);
  });

  it('defaults to horizontal when isBlankOnlyTemplate is true and no choiceLayout configured', () => {
    const r = computeLayoutProfile({ template: '<p>{{blank}}</p>' });
    expect(r.choiceLayout).toBe('horizontal');
    expect(r.isHorizontalChoices).toBe(true);
  });

  it('defaults to vertical for a normal sentence template', () => {
    const r = computeLayoutProfile({ template: '<p>The word is {{blank}}.</p>' });
    expect(r.choiceLayout).toBe('vertical');
    expect(r.isHorizontalChoices).toBe(false);
  });

  it('configured choiceLayout overrides audio-only default', () => {
    const r = computeLayoutProfile({ interactionMode: 'audio_mc_only', choiceLayout: 'vertical' });
    expect(r.choiceLayout).toBe('vertical');
  });
});

describe('computeLayoutProfile — hasInlineSentenceAudioLayout', () => {
  it('is true when layoutProfile is inline_sentence and hasAudio is true', () => {
    const r = computeLayoutProfile({ layoutProfile: 'inline_sentence', hasAudio: true });
    expect(r.hasInlineSentenceAudioLayout).toBe(true);
  });

  it('is false when layoutProfile is inline_sentence but hasAudio is false', () => {
    const r = computeLayoutProfile({ layoutProfile: 'inline_sentence', hasAudio: false });
    expect(r.hasInlineSentenceAudioLayout).toBe(false);
  });

  it('is false for other profiles even when hasAudio is true', () => {
    expect(
      computeLayoutProfile({ layoutProfile: 'audio_blank_only', hasAudio: true })
        .hasInlineSentenceAudioLayout
    ).toBe(false);
    expect(
      computeLayoutProfile({ layoutProfile: '', hasAudio: true }).hasInlineSentenceAudioLayout
    ).toBe(false);
  });
});

describe('computeLayoutProfile — useFeatureButtonAudio', () => {
  it('uses explicit boolean true when configured', () => {
    const r = computeLayoutProfile({ useFeatureButtonAudio: true, hasAudio: false });
    expect(r.useFeatureButtonAudio).toBe(true);
  });

  it('uses explicit boolean false when configured', () => {
    const r = computeLayoutProfile({
      useFeatureButtonAudio: false,
      hasAudio: true,
      layoutProfile: 'audio_blank_only',
    });
    expect(r.useFeatureButtonAudio).toBe(false);
  });

  it('derives true for audio_blank_only profile with hasAudio=true', () => {
    const r = computeLayoutProfile({ layoutProfile: 'audio_blank_only', hasAudio: true });
    expect(r.useFeatureButtonAudio).toBe(true);
  });

  it('derives true for stimulus_image_blank profile with hasAudio=true', () => {
    const r = computeLayoutProfile({ layoutProfile: 'stimulus_image_blank', hasAudio: true });
    expect(r.useFeatureButtonAudio).toBe(true);
  });

  it('derives true for token_sequence profile with hasAudio=true', () => {
    const r = computeLayoutProfile({ layoutProfile: 'token_sequence', hasAudio: true });
    expect(r.useFeatureButtonAudio).toBe(true);
  });

  it('derives false for inline_sentence profile (not in feature-button set)', () => {
    const r = computeLayoutProfile({ layoutProfile: 'inline_sentence', hasAudio: true });
    expect(r.useFeatureButtonAudio).toBe(false);
  });

  it('derives false when hasAudio is false regardless of profile', () => {
    const r = computeLayoutProfile({ layoutProfile: 'audio_blank_only', hasAudio: false });
    expect(r.useFeatureButtonAudio).toBe(false);
  });

  it('treats null as unconfigured and falls back to derived logic', () => {
    const r = computeLayoutProfile({
      useFeatureButtonAudio: null,
      hasAudio: true,
      layoutProfile: 'audio_blank_only',
    });
    expect(r.useFeatureButtonAudio).toBe(true);
  });
});
