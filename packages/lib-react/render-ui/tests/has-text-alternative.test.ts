import { describe, expect, it } from 'vitest';
import { hasTextAlternative } from '../src/has-text-alternative';

describe('hasTextAlternative', () => {
  it('counts text and described images', () => {
    expect(hasTextAlternative('Twelve')).toBe(true);
    expect(hasTextAlternative('<img src="a.png" alt="A red triangle">')).toBe(true);
    expect(hasTextAlternative('<p>Twelve</p><img src="a.png" alt="">')).toBe(true);
  });

  it('counts an empty alt as no description, whatever attributes follow it', () => {
    expect(hasTextAlternative('<img src="a.png" alt="" data-type="image-upload-node">')).toBe(false);
    expect(hasTextAlternative("<img src='a.png' alt=''>")).toBe(false);
    expect(hasTextAlternative('<img src="a.png" alt="   " title="x">')).toBe(false);
  });

  it('counts an image without alt, and markup with no text, as nameless', () => {
    expect(hasTextAlternative('<img src="a.png">')).toBe(false);
    expect(hasTextAlternative('<p>&nbsp;</p>')).toBe(false);
    expect(hasTextAlternative('')).toBe(false);
    expect(hasTextAlternative(undefined)).toBe(false);
  });
});
