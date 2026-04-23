import { describe, expect, it } from 'vitest';
import { stripHtml, tileAccessibleName } from '../src/delivery/tile-accessible-name.js';

describe('tileAccessibleName', () => {
  it('prefers image alt when an image URL is present', () => {
    expect(
      tileAccessibleName({
        label: 'Ignore me',
        imageUrl: 'https://example.com/a.png',
        imageAlt: 'Frog',
      })
    ).toBe('Frog');
  });

  it('falls back to stripped label when no image', () => {
    expect(tileAccessibleName({ label: '<b>Hi</b>', imageUrl: '', imageAlt: '' })).toBe('Hi');
  });

  it('returns Tile when nothing usable is present', () => {
    expect(tileAccessibleName({ label: '', imageUrl: '', imageAlt: '' })).toBe('Tile');
  });
});

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>a  b</p>')).toBe('a b');
  });
});
