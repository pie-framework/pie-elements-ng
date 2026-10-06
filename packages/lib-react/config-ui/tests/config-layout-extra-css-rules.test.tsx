/**
 * Two authoring layouts on one page, each with its own authored rules: each layout's
 * rules target a class only that layout carries.
 */
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import ConfigLayout from '../src/layout/config-layout.js';

const Layout = ConfigLayout as any;

afterEach(cleanup);

// The single class an authored-rules style nests under.
const scopeOf = (style: HTMLStyleElement) => style.textContent?.match(/^\.([\w-]+) \{/)?.[1];

describe('config layout extra CSS rules', () => {
  it('scopes each layout’s rules to that layout’s main container', () => {
    render(
      <>
        <Layout extraCSSRules={{ rules: '&.main-container { color: red; }' }}>
          <p>a</p>
        </Layout>
        <Layout extraCSSRules={{ rules: '&.main-container { color: blue; }' }}>
          <p>b</p>
        </Layout>
      </>,
    );

    const containers = [...document.querySelectorAll('.main-container')];
    const styles = [...document.querySelectorAll('style')].filter((s) => s.textContent?.includes('color:'));
    expect(containers).toHaveLength(2);
    expect(styles).toHaveLength(2);

    for (const [i, color] of ['red', 'blue'].entries()) {
      const scope = scopeOf(styles[i]);
      expect(scope).toMatch(/^extra-css-rules-/);
      expect(styles[i].textContent).toBe(`.${scope} { &.main-container { color: ${color}; } }`);
      expect(styles[i].parentElement).toBe(containers[i]);
      expect([...document.querySelectorAll(`.${scope}`)]).toEqual([containers[i]]);
      expect(containers[i].classList).toContain('extraCSSRules');
    }
  });
});
