import { useMemo, useState } from 'react';
import { nextPopupState, type PopupState } from './popup-state.js';

export function usePopupState(initialOpen = false): {
  state: PopupState;
  open: () => void;
  close: () => void;
  trapFocus: () => void;
  releaseFocus: () => void;
} {
  const [state, setState] = useState<PopupState>(initialOpen ? 'open' : 'closed');

  return useMemo(
    () => ({
      state,
      open: () => {
        setState((prev: PopupState) =>
          nextPopupState(nextPopupState(prev, { type: 'OPEN' }), { type: 'OPENED' })
        );
      },
      close: () => {
        setState((prev: PopupState) =>
          nextPopupState(nextPopupState(prev, { type: 'CLOSE' }), { type: 'CLOSED' })
        );
      },
      trapFocus: () => {
        setState((prev: PopupState) => nextPopupState(prev, { type: 'TRAP_FOCUS' }));
      },
      releaseFocus: () => {
        setState((prev: PopupState) => nextPopupState(prev, { type: 'RELEASE_FOCUS' }));
      },
    }),
    [state]
  );
}
