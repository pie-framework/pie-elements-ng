/**
 * Two layouts on one page, each with its own authored rules: each layout's rules
 * target a class only that layout carries.
 */
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import UiLayout from '../src/ui-layout.js';

const Layout = UiLayout as any;

const roots: Root[] = [];

const render = (element: React.ReactElement) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  const rerender = (next: React.ReactElement) => act(() => root.render(next));
  rerender(element);
  return { rerender };
};

afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.innerHTML = '';
});

// The single class an authored-rules style nests under.
const scopeOf = (style: HTMLStyleElement) => style.textContent?.match(/^\.([\w-]+) \{/)?.[1];

// Layout styles from the theme share the page, so the authored-rules styles are told apart by content.
const rulesStyles = () => [...document.body.querySelectorAll('style')].filter((s) => s.textContent?.includes('color:'));
const rulesStyle = () => rulesStyles()[0];

describe('ui layout extra CSS rules', () => {
  it('scopes each layout’s rules to that layout', () => {
    render(
      <>
        <Layout className="item-a" extraCSSRules={{ names: ['red'], rules: '.red { color: red; }' }} />
        <Layout className="item-b" extraCSSRules={{ names: ['blue'], rules: '.blue { color: blue; }' }} />
      </>,
    );

    const styles = rulesStyles();
    expect(styles).toHaveLength(2);

    for (const [style, item, rule] of [
      [styles[0], 'item-a', '.red { color: red; }'],
      [styles[1], 'item-b', '.blue { color: blue; }'],
    ] as const) {
      const scope = scopeOf(style);
      expect(scope).toMatch(/^extra-css-rules-/);
      expect(style.textContent).toBe(`.${scope} { ${rule} }`);
      expect([...document.querySelectorAll(`.${scope}`)]).toEqual([document.querySelector(`.${item}`)]);
    }
  });

  it('keeps the extraCSSRules class on every layout', () => {
    render(
      <>
        <Layout className="item-a" />
        <Layout className="item-b" extraCSSRules={{ rules: '.x { color: red; }' }} />
      </>,
    );

    expect(document.querySelectorAll('.extraCSSRules')).toHaveLength(2);
  });

  it('keeps its scope when it re-renders', () => {
    const { rerender } = render(<Layout className="item-a" extraCSSRules={{ rules: '.x { color: red; }' }} />);
    const before = scopeOf(rulesStyle());

    rerender(<Layout className="item-a" extraCSSRules={{ rules: '.x { color: blue; }' }} />);

    expect(rulesStyle().textContent).toBe(`.${before} { .x { color: blue; } }`);
    expect(document.querySelector('.item-a')?.classList).toContain(before);
  });
});
