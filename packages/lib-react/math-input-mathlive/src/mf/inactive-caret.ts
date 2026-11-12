// @ts-nocheck

import { KEYSTROKES } from '../latex-bridge.js';

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
 * A character typed on the physical keyboard: a letter, digit or symbol. Space (it presses the
 * focused button), Enter, Tab and the arrows are not characters, and Ctrl, Cmd and Alt shortcuts
 * are left alone. AltGr, reported as Ctrl+Alt, types characters on many keyboards, and on macOS
 * Option reports plain Alt but types a non-ASCII character (Option+p is π).
 * `\` is not forwarded: it switches the field to LaTeX mode, and the keys that end that mode
 * (Space, Enter, Tab) belong to the keypad, so the field would stay stuck there.
 */
const isTypedCharacter = (event) => {
  if (event.defaultPrevented || event.isComposing || event.key?.length !== 1 || event.key === ' ' || event.key === '\\') {
    return false;
  }

  const altGraph = event.getModifierState?.('AltGraph');
  const optionCharacter = event.altKey && !event.ctrlKey && event.key.charCodeAt(0) > 127;

  return !event.metaKey && (altGraph || optionCharacter || !(event.ctrlKey || event.altKey));
};

/** Backspace or Delete on its own, which deletes in the field. With a modifier, it is a shortcut. */
const isDeleteKey = (event) =>
  !event.defaultPrevented &&
  (event.key === 'Backspace' || event.key === 'Delete') &&
  !(event.ctrlKey || event.metaKey || event.altKey);

/**
 * MathLive hides its caret when a field blurs, though it keeps the insertion point. While a keypad
 * button has focus, keep the caret showing there, and send what is typed on the keyboard to the
 * field, as if typed in it: `/` starts a fraction, `^` an exponent, and Backspace and Delete delete.
 * Focus stays on the button.
 * Focus going anywhere else removes the caret and stops the typing.
 *
 * @param {HTMLElement} mathField A `<math-field>`.
 * @returns {function} A function that removes the listeners and the caret.
 */
export function keepCaretWhileKeypadFocused(mathField) {
  if (!mathField || typeof mathField.addEventListener !== 'function') {
    return () => {};
  }

  const setShown = (shown) => mathField.classList.toggle(KEYPAD_CARET_CLASS, shown);

  // The keypad focus moved to from this field. Another field's keypad is not this field's.
  let keypad = null;
  const inOwnKeypad = (node) => !!keypad && !!node && keypad.contains(node);

  const stopWatchingFocus = () => {
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('focusout', onFocusOut, true);
    document.removeEventListener('keydown', onKeyDown, true);
  };

  const hide = () => {
    stopWatchingFocus();
    keypad = null;
    setShown(false);
  };

  const onFocusIn = (event) => {
    const target = event.composedPath?.()[0] ?? event.target;

    // Back in the field, MathLive shows its own caret; anywhere but its keypad, there is none.
    if (mathField.contains(target) || mathField.shadowRoot?.contains(target) || !inOwnKeypad(target)) {
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
      if (document.hasFocus() && !inOwnKeypad(deepActiveElement())) {
        hide();
      }
    });
  };

  const onKeyDown = (event) => {
    // A field taken off the page without teardown takes no more typing.
    if (!mathField.isConnected) {
      hide();
      return;
    }

    const target = event.composedPath?.()[0] ?? event.target;

    if (!inOwnKeypad(target)) {
      return;
    }

    if (isTypedCharacter(event)) {
      event.preventDefault();
      event.stopPropagation();
      mathField.executeCommand?.(['typedText', event.key, { simulateKeystroke: true }]);
    } else if (isDeleteKey(event)) {
      event.preventDefault();
      event.stopPropagation();
      mathField.executeCommand?.(KEYSTROKES[event.key]);
    }
  };

  const onBlur = (event) => {
    // A read-only field shows no caret, unless it has answer blocks to type into.
    if (!inKeypad(event.relatedTarget) || (mathField.readOnly && !mathField.getPrompts?.().length)) {
      return;
    }

    keypad = event.relatedTarget.closest(KEYPAD_SELECTOR);
    setShown(true);
    stopWatchingFocus();
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    document.addEventListener('keydown', onKeyDown, true);
  };

  mathField.addEventListener('blur', onBlur);

  return () => {
    mathField.removeEventListener('blur', onBlur);
    hide();
  };
}
