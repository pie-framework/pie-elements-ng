/** The legacy `keyCode` a browser reports for a keydown the IME consumes. */
const IME_PROCESS_KEY_CODE = 229;

interface ComposableKeyEvent {
  isComposing?: boolean;
  keyCode?: number;
  /** A React synthetic event carries `isComposing` only on its native event. */
  nativeEvent?: { isComposing?: boolean };
}

/**
 * Whether a keydown belongs to an IME composition, so it must not act as a shortcut. Safari
 * reports `isComposing` false on the Enter that commits a composition and marks it only with
 * `keyCode` 229.
 */
export function isComposingKeyEvent(event: ComposableKeyEvent | null | undefined): boolean {
  if (!event) return false;
  return Boolean(
    event.isComposing || event.nativeEvent?.isComposing || event.keyCode === IME_PROCESS_KEY_CODE
  );
}
