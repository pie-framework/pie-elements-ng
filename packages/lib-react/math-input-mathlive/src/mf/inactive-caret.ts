// @ts-nocheck

/** Marks the keypad root, so a field knows that focus moved to a keypad button. */
export const KEYPAD_ATTRIBUTE = 'data-math-keypad';

/** Set on a `<math-field>` while a keypad button has focus; the shadow CSS then shows its caret. */
export const KEYPAD_CARET_CLASS = 'pie-caret-for-keypad';

/**
 * MathLive always renders its caret at the insertion point, but only shows it while the field has
 * focus (`.ML__focused`). While a keypad button has focus, show it steady, without the blink, so
 * it reads differently from a focused field.
 */
export const KEYPAD_CARET_CSS = [
  `:host(.${KEYPAD_CARET_CLASS}) .ML__caret::after,`,
  `:host(.${KEYPAD_CARET_CLASS}) .ML__text-caret::after{visibility:visible;animation:none}`,
  // The caret drawn in a selected placeholder (see PLACEHOLDER_CARET_CSS) stops blinking too.
  `:host(.${KEYPAD_CARET_CLASS}) .ML__selected:not(:has(.ML__selected))::after{animation:none}`,
].join('');

const KEYPAD_SELECTOR = `[${KEYPAD_ATTRIBUTE}]`;

const inKeypad = (node) => !!node?.closest?.(KEYPAD_SELECTOR);

/** The focused element, looking through shadow roots. */
const deepActiveElement = () => {
  let active = document.activeElement;

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  return active;
};

/**
 * MathLive hides its caret when a field blurs, though it keeps the insertion point. While a keypad
 * button has focus, keep the caret showing there. Focus going anywhere else removes it.
 *
 * @param {HTMLElement} mathField A `<math-field>`.
 * @returns {function} A function that removes the listeners and the caret.
 */
export function keepCaretWhileKeypadFocused(mathField) {
  if (!mathField || typeof mathField.addEventListener !== 'function') {
    return () => {};
  }

  const setShown = (shown) => mathField.classList.toggle(KEYPAD_CARET_CLASS, shown);

  const stopWatchingFocus = () => {
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('focusout', onFocusOut, true);
  };

  const hide = () => {
    stopWatchingFocus();
    setShown(false);
  };

  const onFocusIn = (event) => {
    const target = event.composedPath?.()[0] ?? event.target;

    // Back in the field, MathLive shows its own caret; anywhere but the keypad, there is none.
    if (mathField.contains(target) || mathField.shadowRoot?.contains(target) || !inKeypad(target)) {
      hide();
    }
  };

  // Focus moving to something unfocusable fires no focusin.
  const onFocusOut = (event) => {
    if (event.relatedTarget) {
      return;
    }

    setTimeout(() => {
      // Switching windows also gives a null relatedTarget, so check that the page still has focus.
      if (document.hasFocus() && !inKeypad(deepActiveElement())) {
        hide();
      }
    });
  };

  const onBlur = (event) => {
    // A read-only field shows no caret, unless it has answer blocks to type into.
    if (!inKeypad(event.relatedTarget) || (mathField.readOnly && !mathField.getPrompts?.().length)) {
      return;
    }

    setShown(true);
    stopWatchingFocus();
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
  };

  mathField.addEventListener('blur', onBlur);

  return () => {
    mathField.removeEventListener('blur', onBlur);
    hide();
  };
}
