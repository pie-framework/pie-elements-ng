import { catalogs } from '../i18n/index.js';

/**
 * Names the textarea MathQuill puts in each editable field under `root`, the control a screen
 * reader lands on; MathQuill gives it no name. Static math's own selection textarea sits outside
 * any editable field and is left alone.
 *
 * The name follows `language`. A locale that is not resident names the fields in English and
 * starts loading; `onLoad` runs once it settles, so a component passes its own relabel there.
 */
export function labelFieldTextareas(
  root: Element | null | undefined,
  language?: string,
  onLoad?: () => void,
): void {
  if (!root) {
    return;
  }

  const label = catalogs.forLocale(language, onLoad).t('enterAnswerA11y');

  for (const textarea of root.querySelectorAll('.mq-editable-field > .mq-textarea > textarea')) {
    textarea.setAttribute('aria-label', label);
  }
}
