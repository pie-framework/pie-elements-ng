import { catalogs } from '../i18n/index.js';

/**
 * Names a `<math-field>`. MathLive falls back to an untranslated "math input field" when the
 * element has no `aria-label` of its own.
 *
 * What a screen reader lands on is MathLive's keyboard input, a textbox inside the field's
 * shadow root, so it gets the name too: the field's own label does not reach it, and MathLive
 * only names it with the spoken math once it has focus. That input only exists once the field
 * is connected, so call this again after mounting the field.
 *
 * The field is a group around that textbox. With MathLive's own `math` role, which it sets
 * through ElementInternals, a focusable field holding a focusable textbox is a nested
 * interactive control.
 *
 * The name follows `language`. A locale that is not resident names the field in English and
 * starts loading; `onLoad` runs once it settles, so a component passes its own relabel there.
 */
export function labelMathField(
  mathField: Element | null | undefined,
  language?: string,
  onLoad?: () => void,
): void {
  if (!mathField) {
    return;
  }

  const name = catalogs.forLocale(language, onLoad).t('enterAnswerA11y');

  mathField.setAttribute('role', 'group');
  mathField.setAttribute('aria-label', name);
  mathField.shadowRoot?.querySelector('.ML__keyboard-sink')?.setAttribute('aria-label', name);
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
