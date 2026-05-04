import { type LayoutLimits, DEFAULT_LAYOUT_LIMITS } from '../shared/layoutLimits';
export type { LayoutLimits };
export { DEFAULT_LAYOUT_LIMITS };

export const DEFAULT_LAYOUT_PROFILE_PRESETS: Record<string, Partial<LayoutLimits>> = {
  audio_blank_only: {
    blankWideWidthRem: 10,
    blankUnderlineWideWidthPx: 6,
    horizontalChoiceTileMinHeightRem: 11.25,
    horizontalChoiceContentMinHeightRem: 9.375,
    choiceGroupGapRem: 1,
    audioBlankTemplateMarginBottomRem: 1.875,
  },
  stimulus_image_blank: {
    blankWideWidthRem: 10,
    blankUnderlineWideWidthPx: 6,
  },
  token_sequence: {
    blankStandaloneWidthRem: 7,
    blankUnderlineWideWidthPx: 6,
  },
};

export interface LayoutStyleResult {
  rootStyle: string;
  blankWidth: string;
  blankBorderWidth: string;
  legendMaxChars: number;
}

export function computeLayoutStyle(params: {
  layoutProfile: string;
  isBlankOnlyTemplate: boolean;
  configuredLimits: unknown;
  customProfilePresets: unknown;
  correctAnswerStyleVars: string;
}): LayoutStyleResult {
  const { layoutProfile, isBlankOnlyTemplate, correctAnswerStyleVars } = params;

  const configured =
    params.configuredLimits && typeof params.configuredLimits === 'object'
      ? (params.configuredLimits as Partial<LayoutLimits>)
      : {};
  const customPresets =
    params.customProfilePresets && typeof params.customProfilePresets === 'object'
      ? (params.customProfilePresets as Record<string, unknown>)
      : {};
  const customForProfile =
    customPresets[layoutProfile] && typeof customPresets[layoutProfile] === 'object'
      ? (customPresets[layoutProfile] as Partial<LayoutLimits>)
      : {};
  const profilePreset: Partial<LayoutLimits> = {
    ...(DEFAULT_LAYOUT_PROFILE_PRESETS[layoutProfile] ?? {}),
    ...customForProfile,
  };
  const l: LayoutLimits = { ...DEFAULT_LAYOUT_LIMITS, ...configured, ...profilePreset };

  const wideBlankProfiles = ['audio_blank_only', 'stimulus_image_blank'];
  const wideUnderlineProfiles = ['audio_blank_only', 'stimulus_image_blank', 'token_sequence'];

  const blankWidth = wideBlankProfiles.includes(layoutProfile)
    ? `${l.blankWideWidthRem}rem`
    : isBlankOnlyTemplate
      ? `${l.blankStandaloneWidthRem}rem`
      : 'auto';

  const blankBorderWidth = wideUnderlineProfiles.includes(layoutProfile)
    ? `${l.blankUnderlineWideWidthPx}px`
    : `${l.blankUnderlineWidthPx}px`;

  const rootStyle = [
    // Blank slot
    `--mpb-blank-standalone-width:${l.blankStandaloneWidthRem}rem`,
    `--mpb-blank-wide-width:${l.blankWideWidthRem}rem`,
    `--mpb-blank-underline-width:${l.blankUnderlineWidthPx}px`,
    `--mpb-blank-underline-wide-width:${l.blankUnderlineWideWidthPx}px`,
    // Choice tiles
    `--mpb-choice-width-px:${l.horizontalChoiceWidthPx}px`,
    `--mpb-choice-width-vw:${l.horizontalChoiceWidthVw}vw`,
    `--mpb-choice-tile-min-height:${l.horizontalChoiceTileMinHeightRem}rem`,
    `--mpb-choice-content-min-height:${l.horizontalChoiceContentMinHeightRem}rem`,
    `--mpb-choice-image-max-height:${l.choiceImageMaxHeightRem}rem`,
    `--mpb-selected-image-max-height:${l.selectedImageMaxHeightRem}rem`,
    `--mpb-choice-group-gap:${l.choiceGroupGapRem}rem`,
    `--mpb-choice-row-gap:${l.choiceRowGapRem}rem`,
    `--mpb-horizontal-choice-radio-top-margin:${l.horizontalChoiceRadioTopMarginRem}rem`,
    `--mpb-narrow-choice-max-width:${l.narrowHorizontalChoiceMaxWidthPx}px`,
    `--mpb-toggle-button-gap:${l.toggleButtonGapRem}rem`,
    // Audio
    `--mpb-listen-button-size:${l.listenButtonSizePx}px`,
    `--mpb-audio-blank-template-margin-top:${l.audioBlankTemplateMarginTopRem}rem`,
    `--mpb-audio-blank-template-margin-bottom:${l.audioBlankTemplateMarginBottomRem}rem`,
    `--mpb-audio-instructions-max-width:${l.audioInstructionsMaxWidthPx}px`,
    // Profile grids
    `--mpb-stimulus-min-column:${l.stimulusMinColumnPx}px`,
    `--mpb-text-min-column:${l.textMinColumnPx}px`,
    `--mpb-stimulus-grid-column-gap:${l.stimulusGridColumnGapRem}rem`,
    `--mpb-stimulus-grid-row-gap:${l.stimulusGridRowGapRem}rem`,
    `--mpb-stimulus-sentence-margin-top:${l.stimulusSentenceMarginTopRem}rem`,
    `--mpb-stimulus-choices-margin-top:${l.stimulusChoicesMarginTopRem}rem`,
    `--mpb-token-grid-column-gap:${l.tokenGridColumnGapRem}rem`,
    `--mpb-token-grid-row-gap:${l.tokenGridRowGapRem}rem`,
    `--mpb-token-template-margin-top:${l.tokenTemplateMarginTopRem}rem`,
    `--mpb-token-inline-token-gap:${l.tokenInlineTokenGapRem}rem`,
    `--mpb-token-choices-margin-top:${l.tokenChoicesMarginTopRem}rem`,
    `--mpb-inline-grid-column-gap:${l.inlineGridColumnGapRem}rem`,
    `--mpb-inline-grid-row-gap:${l.inlineGridRowGapRem}rem`,
    `--mpb-inline-template-margin-top:${l.inlineTemplateMarginTopRem}rem`,
    `--mpb-inline-choices-margin-top:${l.inlineChoicesMarginTopRem}rem`,
    correctAnswerStyleVars,
  ].join(';');

  return { rootStyle, blankWidth, blankBorderWidth, legendMaxChars: l.legendMaxChars };
}
