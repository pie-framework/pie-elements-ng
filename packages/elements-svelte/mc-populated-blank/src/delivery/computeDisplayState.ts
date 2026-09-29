import {
  LISTEN_PLAYING_DEFAULT_URL,
  LISTEN_PLAYING_ES_URL,
  LISTEN_SILENT_DEFAULT_URL,
  LISTEN_SILENT_ES_URL,
} from './assets/audioButtonSkinAssets';

export type AudioButtonSkin = { silentUrl: string; playingUrl: string };

/**
 * Built-in fallback skins, bundled with this package (no external CDN dependency).
 * Callers can override per-item via `audioButtonSkin` / `audioButtonSkinsByLocale`
 * on the model — see computeFeatureAudioSkin below.
 */
export const DEFAULT_AUDIO_BUTTON_SKINS: Record<string, AudioButtonSkin> = {
  default: {
    silentUrl: LISTEN_SILENT_DEFAULT_URL,
    playingUrl: LISTEN_PLAYING_DEFAULT_URL,
  },
  es: {
    silentUrl: LISTEN_SILENT_ES_URL,
    playingUrl: LISTEN_PLAYING_ES_URL,
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
 * While the correct answer is revealed in evaluate mode it is the correct choice.
 * A player that shows the key outside evaluate hands over the correct-response
 * session from `createCorrectResponseSession`, which is displayed as the selection.
 */
export function computeDisplayChoiceId(params: {
  selectedId: string;
  isEvaluateMode: boolean;
  showCorrectAnswer: boolean;
  correctChoiceId: string;
}): string {
  const { selectedId, isEvaluateMode, showCorrectAnswer, correctChoiceId } = params;
  if (isEvaluateMode && showCorrectAnswer && correctChoiceId) return correctChoiceId;
  return selectedId;
}

/**
 * Returns the result the screen-reader-only announcement reports after evaluate
 * mode scoring. Empty string means nothing is announced.
 */
export function computeResultStatus(params: {
  isEvaluateMode: boolean;
  showCorrectAnswer: boolean;
  isCorrect: boolean;
  isIncorrect: boolean;
  selectedId: string;
}): 'correct' | 'incorrect' | '' {
  const { isEvaluateMode, showCorrectAnswer, isCorrect, isIncorrect, selectedId } = params;
  if (!isEvaluateMode || showCorrectAnswer) return '';
  if (isCorrect) return 'correct';
  if (isIncorrect && selectedId) return 'incorrect';
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
