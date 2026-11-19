import { afterEach, describe, expect, it } from 'vitest';
import { inlineSideOfArrow, isRightToLeft } from '../src/inline-direction';

const block = (style?: string) => {
  const element = document.createElement('p');
  if (style) element.setAttribute('style', style);
  document.body.append(element);
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('inlineSideOfArrow', () => {
  it('maps ArrowLeft to the inline start in left-to-right text', () => {
    const element = block();
    expect(inlineSideOfArrow('ArrowLeft', element)).toBe('inline-start');
    expect(inlineSideOfArrow('ArrowRight', element)).toBe('inline-end');
  });

  it('maps ArrowRight to the inline start in right-to-left text', () => {
    const element = block('direction: rtl');
    expect(inlineSideOfArrow('ArrowRight', element)).toBe('inline-start');
    expect(inlineSideOfArrow('ArrowLeft', element)).toBe('inline-end');
  });

  it('reads the direction when asked, so a change of direction applies to the next key', () => {
    const element = block();
    expect(inlineSideOfArrow('ArrowRight', element)).toBe('inline-end');
    element.style.direction = 'rtl';
    expect(inlineSideOfArrow('ArrowRight', element)).toBe('inline-start');
  });

  it('gives no side for vertical arrows and other keys', () => {
    const element = block('direction: rtl');
    expect(inlineSideOfArrow('ArrowUp', element)).toBeUndefined();
    expect(inlineSideOfArrow('Home', element)).toBeUndefined();
  });

  it('treats a missing element as left to right', () => {
    expect(isRightToLeft(null)).toBe(false);
    expect(inlineSideOfArrow('ArrowLeft', undefined)).toBe('inline-start');
  });
});
