const BLANK_TOKEN = '{{blank}}';

export interface LayoutProfileParams {
  interactionMode?: string;
  template?: string;
  choiceLayout?: string;
  layoutProfile?: string;
  hasAudio?: boolean;
  useFeatureButtonAudio?: boolean | null;
  prompt?: string;
}

export interface LayoutProfileResult {
  isAudioOnlyMode: boolean;
  isBlankOnlyTemplate: boolean;
  choiceLayout: 'horizontal' | 'vertical';
  isHorizontalChoices: boolean;
  hasInlineSentenceAudioLayout: boolean;
  useFeatureButtonAudio: boolean;
  hasVisiblePrompt: boolean;
}

// Media that shows without any text beside it, such as a picture-only passage.
const VISIBLE_MEDIA = /<(img|svg|video|audio|iframe|object|embed|canvas|picture|math)\b/i;

/**
 * Whether authored HTML shows anything. Imported items carry empty prompt
 * wrappers (`<div class="iat-html-container"></div>`), which render nothing but
 * would still take a grid row and label the choices with an empty name.
 */
export function hasVisibleHtmlContent(html: string | undefined): boolean {
  if (!html) return false;
  if (VISIBLE_MEDIA.test(html)) return true;
  return (
    html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ')
      .trim() !== ''
  );
}

const FEATURE_BUTTON_PROFILES = new Set([
  'audio_blank_only',
  'stimulus_image_blank',
  'token_sequence',
]);

export function computeLayoutProfile(params: LayoutProfileParams): LayoutProfileResult {
  const {
    interactionMode = '',
    template = '',
    choiceLayout: configuredChoiceLayout,
    layoutProfile = '',
    hasAudio = false,
    useFeatureButtonAudio: configuredFeatureButton,
    prompt,
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

  const choiceLayout: 'horizontal' | 'vertical' =
    configuredChoiceLayout === 'horizontal' || configuredChoiceLayout === 'vertical'
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
    hasVisiblePrompt: hasVisibleHtmlContent(prompt),
  };
}
