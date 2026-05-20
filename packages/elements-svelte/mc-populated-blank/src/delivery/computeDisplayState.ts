export type AudioButtonSkin = { silentUrl: string; playingUrl: string };

export const DEFAULT_AUDIO_BUTTON_SKINS: Record<string, AudioButtonSkin> = {
  default: {
    silentUrl:
      'https://assets.learnosity.com/organisations/844/0c9f2aa3-3cd5-4de7-93ef-541c24ca35da.svg',
    playingUrl:
      'https://assets.learnosity.com/organisations/844/231dfdc2-c113-4be5-91fb-e75a0ca5994b.svg',
  },
  es: {
    silentUrl:
      'https://assets.learnosity.com/organisations/844/27a9d5b5-d873-4bd5-b9ba-22748782d8ba.svg',
    playingUrl:
      'https://assets.learnosity.com/organisations/844/120f216d-96b7-4560-94b8-1d90710216b7.svg',
  },
};

/**
 * Resolves the audio button skin to display.
 * Priority: byLocale[exact] > byLocale[lang] > byLocale.default > customSingle > built-in default
 */
export function computeFeatureAudioSkin(params: {
  locale: unknown;
  audioButtonSkin: unknown;
  audioButtonSkinsByLocale: unknown;
}): AudioButtonSkin {
  const locale = String(params.locale || '').toLowerCase();
  const lang = locale.slice(0, 2);
  const byLocale =
    params.audioButtonSkinsByLocale && typeof params.audioButtonSkinsByLocale === 'object'
      ? (params.audioButtonSkinsByLocale as Record<string, unknown>)
      : {};
  const customSingle =
    params.audioButtonSkin && typeof params.audioButtonSkin === 'object'
      ? (params.audioButtonSkin as AudioButtonSkin)
      : null;
  const defaultSkin = locale.startsWith('es')
    ? DEFAULT_AUDIO_BUTTON_SKINS.es
    : DEFAULT_AUDIO_BUTTON_SKINS.default;
  return (byLocale[locale] ||
    byLocale[lang] ||
    byLocale.default ||
    customSingle ||
    defaultSkin) as AudioButtonSkin;
}

/**
 * Returns the choice id that the ClozeMarker and selected-state highlight should display.
 * When the correct answer is revealed (alwaysShowCorrect or evaluate+showCorrectAnswer),
 * it shows the correct choice rather than the student's selection.
 */
export function computeDisplayChoiceId(params: {
  selectedId: string;
  isEvaluateMode: boolean;
  showCorrectAnswer: boolean;
  alwaysShowCorrect: boolean;
  correctChoiceId: string;
}): string {
  const { selectedId, isEvaluateMode, showCorrectAnswer, alwaysShowCorrect, correctChoiceId } =
    params;
  if (alwaysShowCorrect && correctChoiceId) return correctChoiceId;
  if (isEvaluateMode && showCorrectAnswer && correctChoiceId) return correctChoiceId;
  return selectedId;
}

/**
 * Returns the screen-reader-only result announcement text shown after evaluate mode scoring.
 * Empty string means nothing is announced.
 */
export function computeResultText(params: {
  isEvaluateMode: boolean;
  showCorrectAnswer: boolean;
  isCorrect: boolean;
  isIncorrect: boolean;
  selectedId: string;
}): string {
  const { isEvaluateMode, showCorrectAnswer, isCorrect, isIncorrect, selectedId } = params;
  if (!isEvaluateMode || showCorrectAnswer) return '';
  if (isCorrect) return 'Correct answer selected';
  if (isIncorrect && selectedId) return 'Incorrect answer selected';
  return '';
}

/**
 * Returns the visible legend text for the choices fieldset.
 * Strips HTML, truncates to legendMaxChars with an ellipsis, falls back to answerChoicesLabel.
 */
export function computeLegendText(params: {
  prompt: string;
  legendMaxChars: number;
  answerChoicesLabel: string;
}): string {
  const { prompt, legendMaxChars, answerChoicesLabel } = params;
  const plain = prompt
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const maxChars = Math.max(8, legendMaxChars);
  if (!plain) return answerChoicesLabel;
  return plain.length > maxChars ? `${plain.slice(0, Math.max(1, maxChars - 1))}…` : plain;
}
