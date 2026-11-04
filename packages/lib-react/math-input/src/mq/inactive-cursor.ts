// @ts-nocheck

/** Marks the keypad root, so a field knows that focus moved to a keypad button. */
export const KEYPAD_ATTRIBUTE = 'data-math-keypad';

const KEYPAD_SELECTOR = `[${KEYPAD_ATTRIBUTE}]`;

const watched = new WeakSet();

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
 * MathQuill removes its cursor when a field blurs, though it remembers the insertion point. While
 * a keypad button has focus, keep a steady (non-blinking) cursor there. Focus going anywhere else
 * removes it.
 *
 * @param field A MathQuill editable field (MathField or an inner field of static math).
 * @returns A function that removes the listeners and the cursor.
 */
export function keepCursorWhileKeypadFocused(field) {
  const ctrlr = field?.__controller;
  const textarea = field?.el?.()?.querySelector('textarea');

  if (!ctrlr || !textarea || watched.has(textarea)) {
    return () => {};
  }

  watched.add(textarea);

  const { cursor } = ctrlr;
  let shown = false;
  let timer;

  const stopWatchingFocus = () => {
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('focusout', onFocusOut, true);
  };

  const hide = () => {
    stopWatchingFocus();

    if (shown) {
      shown = false;
      cursor.hide().parent.blur();
    }
  };

  const onFocusIn = (event) => {
    const target = event.composedPath?.()[0] ?? event.target;

    if (target === textarea) {
      // The field shows its own cursor again.
      shown = false;
      stopWatchingFocus();
    } else if (!textarea.isConnected || !inKeypad(target)) {
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
      if (shown && document.hasFocus() && !inKeypad(deepActiveElement())) {
        hide();
      }
    });
  };

  textarea.addEventListener('blur', (event) => {
    if (!inKeypad(event.relatedTarget)) {
      return;
    }

    // Wait for MathQuill's own blur timeout, which hides the cursor.
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!textarea.isConnected || !ctrlr.blurred || !cursor.parent || !inKeypad(deepActiveElement())) {
        return;
      }

      cursor.show();
      // Stop the blink; keeping the id lets a later show() restart it.
      clearInterval(cursor.intervalId);
      cursor.jQ.removeClass('mq-blink');
      shown = true;
      document.addEventListener('focusin', onFocusIn, true);
      document.addEventListener('focusout', onFocusOut, true);
    });
  });

  return () => {
    clearTimeout(timer);
    hide();
  };
}
