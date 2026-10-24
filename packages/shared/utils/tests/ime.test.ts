import { describe, expect, it } from 'vitest';
import { isComposingKeyEvent } from '../src/ime';

describe('isComposingKeyEvent', () => {
  it('is true while a native event composes', () => {
    expect(
      isComposingKeyEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true }))
    ).toBe(true);
  });

  it('is true for the keyCode 229 Safari sends on the committing Enter', () => {
    expect(isComposingKeyEvent({ isComposing: false, keyCode: 229 })).toBe(true);
  });

  it('reads isComposing from a React synthetic event through its native event', () => {
    expect(isComposingKeyEvent({ keyCode: 13, nativeEvent: { isComposing: true } })).toBe(true);
  });

  it('is false for an ordinary key and for no event', () => {
    expect(isComposingKeyEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13 }))).toBe(
      false
    );
    expect(isComposingKeyEvent(undefined)).toBe(false);
  });
});
