import Translator from '@pie-lib/translator';

const { translator } = Translator;

/**
 * Names the textarea MathQuill puts in each editable field under `root`, the control a screen
 * reader lands on; MathQuill gives it no name. Static math's own selection textarea sits outside
 * any editable field and is left alone.
 */
export function labelFieldTextareas(root: Element | null | undefined, language?: string): void {
  if (!root) {
    return;
  }

  const label = translator.t('mathInput.enterAnswer', { lng: language });

  for (const textarea of root.querySelectorAll('.mq-editable-field > .mq-textarea > textarea')) {
    textarea.setAttribute('aria-label', label);
  }
}
