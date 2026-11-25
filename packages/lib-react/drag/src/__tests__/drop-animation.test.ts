import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DropAnimation } from '@dnd-kit/core';

import { motionSafeDropAnimation } from '../drop-animation';

const matchMediaReporting = (reduce: boolean) =>
  vi.fn((query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

const custom: DropAnimation = { duration: 100, easing: 'linear' };

describe('motionSafeDropAnimation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('turns every drop animation off under reduced motion', () => {
    const matchMedia = matchMediaReporting(true);
    vi.stubGlobal('matchMedia', matchMedia);

    expect(motionSafeDropAnimation()).toBeNull();
    expect(motionSafeDropAnimation(undefined)).toBeNull();
    expect(motionSafeDropAnimation(custom)).toBeNull();
    expect(motionSafeDropAnimation(null)).toBeNull();
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it("keeps the view's own drop animation otherwise", () => {
    vi.stubGlobal('matchMedia', matchMediaReporting(false));

    expect(motionSafeDropAnimation()).toBeUndefined();
    expect(motionSafeDropAnimation(custom)).toBe(custom);
    expect(motionSafeDropAnimation(null)).toBeNull();
  });

  it('keeps it where matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(motionSafeDropAnimation()).toBeUndefined();
    expect(motionSafeDropAnimation(custom)).toBe(custom);
  });
});
