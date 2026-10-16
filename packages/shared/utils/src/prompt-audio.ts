/**
 * Autoplay and completion rules for a prompt's audio, shared by the elements with an authored
 * `autoplayAudioEnabled` setting.
 */

export interface AutoplayAudioFields {
  autoplayAudioEnabled?: boolean;
  /** Written by pie-players' item player when the toolkit holds autoplay for the item. */
  autoplayAudioHeld?: boolean;
}

/** Whether the prompt audio starts on its own. A hold outranks the authored setting. */
export const autoplayAudioOn = (fields?: AutoplayAudioFields | null): boolean =>
  !!fields?.autoplayAudioEnabled && !fields?.autoplayAudioHeld;

/**
 * The markup switches `autoplayAudioEnabled` replaces. `sanitizeModelHtml` removes them from
 * model HTML, so the model setting is the only start for prompt audio and a hold can stop it.
 * pie-players' item player removes the same from item markup through its autoplay applier.
 */
export const AUTOPLAY_AUDIO_MARKUP_ATTRS: readonly string[] = ['autoplay'];

const FAILED_ATTR = 'data-pie-audio-failed';

const hasSource = (audio: HTMLAudioElement) =>
  !!audio.getAttribute('src') || !!audio.querySelector('source[src]:not([src=""])');

/**
 * Whether `completeAudioEnabled` still waits on the prompt audio in `root`. It waits on the
 * first `<audio>` when that sits in a prompt, has a source, has not failed to load, and neither
 * this mount nor the session (`audioEndTime`, kept across a resume) records it as played.
 */
export function promptAudioPending(
  root: ParentNode | null | undefined,
  session: { audioEndTime?: number } | null | undefined,
  audioComplete: boolean
): boolean {
  if (audioComplete || session?.audioEndTime) return false;
  const audio = root?.querySelector('audio');
  if (!audio?.closest('.preview-prompt')) return false;
  return hasSource(audio) && audio.error === null && !audio.hasAttribute(FAILED_ATTR);
}

/**
 * Marks the audio failed when it cannot load, so `promptAudioPending` stops waiting on it, and
 * calls `onFailure`. A `<source>` reports its failure on itself, so the listener captures.
 * Returns the listener's remover.
 */
export function trackPromptAudioFailure(
  audio: HTMLAudioElement,
  onFailure: () => void
): () => void {
  const handleError = () => {
    audio.setAttribute(FAILED_ATTR, '');
    onFailure();
  };
  audio.addEventListener('error', handleError, true);
  return () => audio.removeEventListener('error', handleError, true);
}
