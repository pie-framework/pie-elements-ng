import { describe, expect, it } from 'vitest';
import { definePieElementThemeDaisyUi, PieElementThemeDaisyUiElement } from '../src/index.js';

describe('pie-element-theme-daisyui', () => {
  it('registers and applies dark theme in document scope', () => {
    definePieElementThemeDaisyUi();
    const wrapper = document.createElement('pie-element-theme-daisyui');
    wrapper.setAttribute('scope', 'document');
    wrapper.setAttribute('theme', 'dark');
    document.body.appendChild(wrapper);

    expect(wrapper).toBeInstanceOf(PieElementThemeDaisyUiElement);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--pie-primary').trim()).toBeTruthy();
  });
});
