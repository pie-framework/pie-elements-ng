const BLANK_TOKEN = '{{blank}}';

export interface LayoutProfileParams {
  interactionMode?: string;
  template?: string;
  choiceLayout?: string;
  layoutProfile?: string;
  hasAudio?: boolean;
  useFeatureButtonAudio?: boolean | null;
}

export interface LayoutProfileResult {
  isAudioOnlyMode: boolean;
  isBlankOnlyTemplate: boolean;
  choiceLayout: 'horizontal' | 'vertical';
  isHorizontalChoices: boolean;
  hasInlineSentenceAudioLayout: boolean;
  useFeatureButtonAudio: boolean;
}

const FEATURE_BUTTON_PROFILES = new Set(['audio_blank_only', 'stimulus_image_blank', 'token_sequence']);

export function computeLayoutProfile(params: LayoutProfileParams): LayoutProfileResult {
  const {
    interactionMode = '',
    template = '',
    choiceLayout: configuredChoiceLayout,
    layoutProfile = '',
    hasAudio = false,
    useFeatureButtonAudio: configuredFeatureButton,
  } = params;

  const isAudioOnlyMode = interactionMode === 'audio_mc_only';

  const isBlankOnlyTemplate = (() => {
    if (!template) return false;
    const plain = template
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    return plain === BLANK_TOKEN;
  })();

  const choiceLayout: 'horizontal' | 'vertical' = configuredChoiceLayout === 'horizontal' ||
    configuredChoiceLayout === 'vertical'
    ? (configuredChoiceLayout as 'horizontal' | 'vertical')
    : isAudioOnlyMode || isBlankOnlyTemplate
      ? 'horizontal'
      : 'vertical';

  const isHorizontalChoices = choiceLayout === 'horizontal';

  const hasInlineSentenceAudioLayout = layoutProfile === 'inline_sentence' && hasAudio;

  const useFeatureButtonAudio =
    typeof configuredFeatureButton === 'boolean'
      ? configuredFeatureButton
      : hasAudio && FEATURE_BUTTON_PROFILES.has(layoutProfile);

  return {
    isAudioOnlyMode,
    isBlankOnlyTemplate,
    choiceLayout,
    isHorizontalChoices,
    hasInlineSentenceAudioLayout,
    useFeatureButtonAudio,
  };
}
