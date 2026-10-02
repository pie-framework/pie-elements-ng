import { describe, expect, it } from 'vitest';
import {
  stripHtml,
  tileAccessibleName,
  tileStatusName,
} from '../src/delivery/tile-accessible-name.js';

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

describe('tileStatusName', () => {
  const croc = { label: 'Crocodile', imageUrl: '', imageAlt: '' };

  it('names the region a placed tile is in', () => {
    expect(tileStatusName(croc, 'Reptile and Egg-layer')).toBe(
      'Crocodile, in Reptile and Egg-layer'
    );
  });

  it('says a tray tile is not placed', () => {
    expect(tileStatusName(croc, null)).toBe('Crocodile, not placed');
  });

  it('adds the verdict in text, not colour alone', () => {
    expect(tileStatusName(croc, 'Reptile and Egg-layer', 'incorrect')).toBe(
      'Crocodile, in Reptile and Egg-layer, incorrect'
    );
    expect(tileStatusName(croc, 'Reptile only', 'correct')).toBe(
      'Crocodile, in Reptile only, correct'
    );
    expect(tileStatusName(croc, null, 'unanswered')).toBe('Crocodile, not placed');
  });

  it('uses the image alt for an image tile', () => {
    expect(
      tileStatusName({ label: '', imageUrl: 'https://example.com/f.png', imageAlt: 'Frog' }, null)
    ).toBe('Frog, not placed');
  });
});
