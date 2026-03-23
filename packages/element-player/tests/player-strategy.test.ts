import { describe, expect, it } from 'vitest';
import {
  normalizeElementPlayerStrategy,
  normalizeElementPlayerView,
  resolveElementPlayerView,
} from '../src/lib/player-strategy';

describe('player-strategy', () => {
  it('normalizes strategy values with fallback', () => {
    expect(normalizeElementPlayerStrategy('esm')).toBe('esm');
    expect(normalizeElementPlayerStrategy('iife')).toBe('iife');
    expect(normalizeElementPlayerStrategy('preloaded')).toBe('preloaded');
    expect(normalizeElementPlayerStrategy('unknown')).toBe('esm');
    expect(normalizeElementPlayerStrategy(undefined, 'iife')).toBe('iife');
  });

  it('normalizes view values with fallback', () => {
    expect(normalizeElementPlayerView('delivery')).toBe('delivery');
    expect(normalizeElementPlayerView('author')).toBe('author');
    expect(normalizeElementPlayerView('print')).toBe('print');
    expect(normalizeElementPlayerView('unknown')).toBe('delivery');
    expect(normalizeElementPlayerView(undefined, 'print')).toBe('print');
  });

  it('resolves view from explicit view first, then mode', () => {
    expect(resolveElementPlayerView({ view: 'print', mode: 'author' })).toBe('print');
    expect(resolveElementPlayerView({ mode: 'author' })).toBe('author');
    expect(resolveElementPlayerView({ mode: 'print' })).toBe('print');
    expect(resolveElementPlayerView({ mode: 'gather' })).toBe('delivery');
    expect(resolveElementPlayerView({}, 'author')).toBe('author');
  });
});
