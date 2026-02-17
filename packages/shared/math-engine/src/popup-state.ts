export type PopupState = 'closed' | 'opening' | 'open' | 'focus-trap' | 'closing';

export type PopupEvent =
  | { type: 'OPEN' }
  | { type: 'OPENED' }
  | { type: 'TRAP_FOCUS' }
  | { type: 'RELEASE_FOCUS' }
  | { type: 'CLOSE' }
  | { type: 'CLOSED' };

const transitions: Record<PopupState, Partial<Record<PopupEvent['type'], PopupState>>> = {
  closed: {
    OPEN: 'opening',
  },
  opening: {
    OPENED: 'open',
    CLOSE: 'closing',
  },
  open: {
    TRAP_FOCUS: 'focus-trap',
    CLOSE: 'closing',
  },
  'focus-trap': {
    RELEASE_FOCUS: 'open',
    CLOSE: 'closing',
  },
  closing: {
    CLOSED: 'closed',
    OPEN: 'opening',
  },
};

export function nextPopupState(state: PopupState, event: PopupEvent): PopupState {
  return transitions[state]?.[event.type] ?? state;
}
