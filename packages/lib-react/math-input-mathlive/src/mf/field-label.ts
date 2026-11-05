import Translator from '@pie-lib/translator';

const { translator } = Translator;

/**
 * Names a `<math-field>`, the control a screen reader lands on. MathLive falls back to an
 * untranslated "math input field" when the element has no `aria-label` of its own.
 */
export function labelMathField(mathField: Element | null | undefined, language?: string): void {
  if (!mathField) {
    return;
  }

  mathField.setAttribute('aria-label', translator.t('mathInput.enterAnswer', { lng: language }));
}

/** Points a `<math-field>` at the element that describes it, or drops the reference. */
export function describeMathField(mathField: Element | null | undefined, describedBy?: string): void {
  if (!mathField) {
    return;
  }

  if (describedBy) {
    mathField.setAttribute('aria-describedby', describedBy);
  } else {
    mathField.removeAttribute('aria-describedby');
  }
}
