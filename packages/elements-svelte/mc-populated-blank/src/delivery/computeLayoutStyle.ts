import { type LayoutLimits, DEFAULT_LAYOUT_LIMITS } from '../shared/layoutLimits';
export type { LayoutLimits };
export { DEFAULT_LAYOUT_LIMITS };

/**
 * Maps every LayoutLimits key (except legendMaxChars, which is a return value not a CSS var)
 * to its --mpb-* CSS variable name and CSS unit.
 * Add a single entry here when adding a new layout limit.
 */
export const CSS_VAR_SPEC: Record<
  Exclude<keyof LayoutLimits, 'legendMaxChars'>,
  { varName: string; unit: string }
> = {
  blankStandaloneWidthRem: { varName: '--mpb-blank-standalone-width', unit: 'rem' },
  blankWideWidthRem: { varName: '--mpb-blank-wide-width', unit: 'rem' },
  blankUnderlineWidthPx: { varName: '--mpb-blank-underline-width', unit: 'px' },
  blankUnderlineWideWidthPx: { varName: '--mpb-blank-underline-wide-width', unit: 'px' },
  horizontalChoiceWidthPx: { varName: '--mpb-choice-width-px', unit: 'px' },
  horizontalChoiceWidthVw: { varName: '--mpb-choice-width-vw', unit: 'vw' },
  horizontalChoiceTileMinHeightRem: { varName: '--mpb-choice-tile-min-height', unit: 'rem' },
  horizontalChoiceContentMinHeightRem: { varName: '--mpb-choice-content-min-height', unit: 'rem' },
  choiceImageMaxHeightRem: { varName: '--mpb-choice-image-max-height', unit: 'rem' },
  selectedImageMaxHeightRem: { varName: '--mpb-selected-image-max-height', unit: 'rem' },
  choiceGroupGapRem: { varName: '--mpb-choice-group-gap', unit: 'rem' },
  choiceRowGapRem: { varName: '--mpb-choice-row-gap', unit: 'rem' },
  horizontalChoiceRadioTopMarginRem: {
    varName: '--mpb-horizontal-choice-radio-top-margin',
    unit: 'rem',
  },
  narrowHorizontalChoiceMaxWidthPx: { varName: '--mpb-narrow-choice-max-width', unit: 'px' },
  toggleButtonGapRem: { varName: '--mpb-toggle-button-gap', unit: 'rem' },
  listenButtonSizePx: { varName: '--mpb-listen-button-size', unit: 'px' },
  audioBlankTemplateMarginTopRem: { varName: '--mpb-audio-blank-template-margin-top', unit: 'rem' },
  audioBlankTemplateMarginBottomRem: {
    varName: '--mpb-audio-blank-template-margin-bottom',
    unit: 'rem',
  },
  audioInstructionsMaxWidthPx: { varName: '--mpb-audio-instructions-max-width', unit: 'px' },
  stimulusMinColumnPx: { varName: '--mpb-stimulus-min-column', unit: 'px' },
  textMinColumnPx: { varName: '--mpb-text-min-column', unit: 'px' },
  stimulusGridColumnGapRem: { varName: '--mpb-stimulus-grid-column-gap', unit: 'rem' },
  stimulusGridRowGapRem: { varName: '--mpb-stimulus-grid-row-gap', unit: 'rem' },
  stimulusSentenceMarginTopRem: { varName: '--mpb-stimulus-sentence-margin-top', unit: 'rem' },
  stimulusChoicesMarginTopRem: { varName: '--mpb-stimulus-choices-margin-top', unit: 'rem' },
  tokenGridColumnGapRem: { varName: '--mpb-token-grid-column-gap', unit: 'rem' },
  tokenGridRowGapRem: { varName: '--mpb-token-grid-row-gap', unit: 'rem' },
  tokenTemplateMarginTopRem: { varName: '--mpb-token-template-margin-top', unit: 'rem' },
  tokenInlineTokenGapRem: { varName: '--mpb-token-inline-token-gap', unit: 'rem' },
  tokenChoicesMarginTopRem: { varName: '--mpb-token-choices-margin-top', unit: 'rem' },
  inlineGridColumnGapRem: { varName: '--mpb-inline-grid-column-gap', unit: 'rem' },
  inlineGridRowGapRem: { varName: '--mpb-inline-grid-row-gap', unit: 'rem' },
  inlineTemplateMarginTopRem: { varName: '--mpb-inline-template-margin-top', unit: 'rem' },
  inlineChoicesMarginTopRem: { varName: '--mpb-inline-choices-margin-top', unit: 'rem' },
};

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
}): LayoutStyleResult {
  const { layoutProfile, isBlankOnlyTemplate } = params;

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

  const cssVars = (Object.keys(CSS_VAR_SPEC) as (keyof typeof CSS_VAR_SPEC)[]).map(
    (key) => `${CSS_VAR_SPEC[key].varName}:${l[key]}${CSS_VAR_SPEC[key].unit}`
  );
  const rootStyle = cssVars.join(';');

  return { rootStyle, blankWidth, blankBorderWidth, legendMaxChars: l.legendMaxChars };
}
