import { describe, expect, it } from 'vitest';
import { definePieElementTheme, PieElementThemeElement } from '../src/theme-elements.js';

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function appendAndConnect<T extends HTMLElement>(el: T): T {
  document.body.appendChild(el);
  return el;
}

describe('pie-element-theme', () => {
  it('applies default light theme variables to itself', () => {
    definePieElementTheme();

    const wrapper = appendAndConnect(document.createElement('pie-element-theme'));

    expect(wrapper).toBeInstanceOf(PieElementThemeElement);
    expect(wrapper.getAttribute('data-theme')).toBe('light');
    expect(wrapper.style.getPropertyValue('--pie-primary').trim()).toBeTruthy();
  });

  it('merges variables override after generated theme vars', () => {
    definePieElementTheme();

    const wrapper = appendAndConnect(document.createElement('pie-element-theme'));
    wrapper.setAttribute('variables', JSON.stringify({ '--pie-primary': '#123456' }));

    expect(wrapper.style.getPropertyValue('--pie-primary').trim()).toBe('#123456');
  });

  it.each(['light', 'dark'])(
    'keeps --pie-missing text at 4.5:1 on the %s page and panel backgrounds',
    (theme) => {
      definePieElementTheme();

      const wrapper = document.createElement('pie-element-theme');
      wrapper.setAttribute('theme', theme);
      appendAndConnect(wrapper);
      const value = (name: string) => wrapper.style.getPropertyValue(name).trim();

      expect(contrast(value('--pie-missing'), value('--pie-background'))).toBeGreaterThanOrEqual(
        4.5
      );
      expect(
        contrast(value('--pie-missing'), value('--pie-background-dark'))
      ).toBeGreaterThanOrEqual(4.5);
    }
  );

  it('supports wrapping unified player tags', () => {
    definePieElementTheme();

    const wrapper = appendAndConnect(document.createElement('pie-element-theme'));
    const deliveryPlayer = document.createElement('pie-element-player');
    deliveryPlayer.setAttribute('view', 'delivery');
    const printPlayer = document.createElement('pie-element-player');
    printPlayer.setAttribute('view', 'print');

    wrapper.appendChild(deliveryPlayer);
    wrapper.appendChild(printPlayer);

    expect(wrapper.querySelector('pie-element-player[view="delivery"]')).toBeTruthy();
    expect(wrapper.querySelector('pie-element-player[view="print"]')).toBeTruthy();
  });
});
