import { afterEach, describe, expect, it, vi } from 'vitest';

import Ebsr from '../index';

// The page's math renderer, as a player installs it, so the parts load no MathJax.
(window as unknown as Record<string, unknown>)['@pie-lib/math-rendering'] = { renderMath: () => {} };

type Host = HTMLElement & { model: object; session: object; cssScope: string };

customElements.define('test-ebsr-extra-css-rules', Ebsr as unknown as CustomElementConstructor);

const part = (key: string) => ({
  choiceMode: 'radio',
  choicePrefix: 'letters',
  prompt: `<p>Part ${key}</p>`,
  choices: [{ value: `${key}1`, label: `${key} one` }],
});

const model = (rules?: string) => ({
  mode: 'gather',
  partA: part('a'),
  partB: part('b'),
  ...(rules && { extraCSSRules: { names: ['x'], rules } }),
});

// A player connects the element first and sets the model after.
const mount = async (rules?: string, { modelFirst = false } = {}) => {
  const el = document.createElement('test-ebsr-extra-css-rules') as Host;
  if (modelFirst) el.model = model(rules);
  document.body.appendChild(el);
  if (!modelFirst) el.model = model(rules);
  el.session = {};
  await vi.waitFor(() => expect(el.querySelectorAll('.main-container')).toHaveLength(2));
  return el;
};

const itemStyle = (el: Host) => el.querySelector(':scope > style[data-extra-css-rules]') as HTMLStyleElement;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ebsr item extra CSS rules', () => {
  it('apply rules that arrive after the element connects, nested under the item', async () => {
    const el = await mount('.x { color: red; }');

    expect(itemStyle(el).textContent).toBe(`.${el.cssScope} { .x { color: red; } }`);
    expect([...document.querySelectorAll(`.${el.cssScope}`)]).toEqual([el]);
  });

  it('apply rules set before the element connects', async () => {
    const el = await mount('.x { color: red; }', { modelFirst: true });

    expect(itemStyle(el).textContent).toBe(`.${el.cssScope} { .x { color: red; } }`);
  });

  it('scope two items on one page apart', async () => {
    const a = await mount('.x { color: red; }');
    const b = await mount('.x { color: blue; }');

    expect(a.cssScope).toMatch(/^ebsr-extra-css-rules-/);
    expect(a.cssScope).not.toBe(b.cssScope);
    expect(itemStyle(b).textContent).toBe(`.${b.cssScope} { .x { color: blue; } }`);
  });

  it('follow a model change', async () => {
    const el = await mount('.x { color: red; }');

    el.model = model('.x { color: blue; }');
    expect(itemStyle(el).textContent).toBe(`.${el.cssScope} { .x { color: blue; } }`);

    el.model = model();
    expect(itemStyle(el).textContent).toBe('');
  });

  it('write no stray text into any style when the item has no rules', async () => {
    const el = await mount();

    for (const style of el.querySelectorAll('style')) {
      expect(style.textContent).not.toContain('undefined');
    }
  });
});
