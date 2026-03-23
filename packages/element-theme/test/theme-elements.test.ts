import { describe, expect, it } from 'vitest';
import { definePieElementTheme, PieElementThemeElement } from '../src/theme-elements.js';

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
