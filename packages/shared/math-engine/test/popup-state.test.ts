import { describe, expect, it } from 'vitest';
import { nextPopupState } from '../src/popup-state';

describe('popup state machine', () => {
  it('follows open and close transitions', () => {
    let state = nextPopupState('closed', { type: 'OPEN' });
    state = nextPopupState(state, { type: 'OPENED' });
    expect(state).toBe('open');

    state = nextPopupState(state, { type: 'TRAP_FOCUS' });
    expect(state).toBe('focus-trap');

    state = nextPopupState(state, { type: 'RELEASE_FOCUS' });
    expect(state).toBe('open');

    state = nextPopupState(state, { type: 'CLOSE' });
    state = nextPopupState(state, { type: 'CLOSED' });
    expect(state).toBe('closed');
  });
});
