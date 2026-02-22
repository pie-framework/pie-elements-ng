import { describe, expect, it } from 'vitest';
import {
  definePieElementTheme,
  PieElementThemeElement,
} from '../src/theme-elements.js';

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

  it('supports wrapping local player tags', () => {
    definePieElementTheme();

    const wrapper = appendAndConnect(document.createElement('pie-element-theme'));
    const esmPlayer = document.createElement('pie-esm-element-player');
    const printPlayer = document.createElement('pie-esm-print-player');

    wrapper.appendChild(esmPlayer);
    wrapper.appendChild(printPlayer);

    expect(wrapper.querySelector('pie-esm-element-player')).toBeTruthy();
    expect(wrapper.querySelector('pie-esm-print-player')).toBeTruthy();
  });
});
