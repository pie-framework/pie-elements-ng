/**
 * What the delivery element renders from the model a player hands it: teacher
 * instructions, the content's `lang`, and the variant sheets for a `customType`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import McPopulatedBlankElement from '../src/delivery/index.js';
import {
  ensureVariantCssInjected,
  keyVariantCss,
  VARIANT_CSS_KEY,
  type VariantCssConfig,
} from '../src/delivery/variant-css-map.js';

const TAG = 'mc-populated-blank--version-0-0-0-render-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, McPopulatedBlankElement as CustomElementConstructor);
}

const MODEL = {
  template: '<p>I {{blank}} at it.</p>',
  choiceMode: 'text',
  choices: [
    { id: 'a', labelHtml: 'louk' },
    { id: 'b', labelHtml: 'look' },
  ],
  interactionMode: 'populate_blank',
  mode: 'gather',
};

const mounted: HTMLElement[] = [];

async function mount(model: Record<string, unknown>, parent: Node = document.body) {
  const element = document.createElement(TAG) as any;
  parent.appendChild(element);
  mounted.push(element);
  element.model = { ...MODEL, ...model };
  element.session = { id: '1', element: TAG };
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
  return element as HTMLElement;
}

const root = (el: HTMLElement) => el.querySelector('.mc-populated-blank-root') as HTMLElement;

afterEach(() => {
  for (const el of mounted.splice(0)) el.remove();
  for (const style of document.querySelectorAll('style[data-mpb-variant]')) style.remove();
  document.body.replaceChildren();
});

describe('teacher instructions', () => {
  it('renders them collapsed behind a toggle that expands them', async () => {
    const el = await mount({ teacherInstructions: '<p>Read aloud.</p>' });
    const toggle = el.querySelector('.teacher-instructions-toggle') as HTMLButtonElement;
    const panel = el.querySelector('.teacher-instructions-content') as HTMLElement;

    expect(toggle.textContent?.trim()).toBe('Show Teacher Instructions');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.hidden).toBe(true);

    toggle.click();
    flushSync();
    expect(toggle.textContent?.trim()).toBe('Hide Teacher Instructions');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    expect(panel.textContent?.trim()).toBe('Read aloud.');
  });

  it("labels the toggle in the item's language", async () => {
    const el = await mount({ teacherInstructions: '<p>Lee en voz alta.</p>', language: 'es_MX' });
    expect(el.querySelector('.teacher-instructions-toggle')?.textContent?.trim()).toBe(
      'Mostrar instrucciones para el maestro'
    );
  });

  it('renders nothing when the controller sends none', async () => {
    const el = await mount({ teacherInstructions: null });
    expect(el.querySelector('.teacher-instructions')).toBeNull();
  });
});

describe('content language', () => {
  it('sets no lang when the item has no language, so the page language applies', async () => {
    const el = await mount({});
    expect(root(el).hasAttribute('lang')).toBe(false);
  });

  it('writes the language as a BCP 47 tag', async () => {
    expect(root(await mount({ language: 'es_MX' })).getAttribute('lang')).toBe('es-MX');
    expect(root(await mount({ locale: 'en_US' })).getAttribute('lang')).toBe('en-US');
  });
});

describe('variant CSS', () => {
  // Vitest stubs `?raw` CSS imports to '', so the sheets are read from disk here.
  const sheet = (name: string) =>
    readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../src/delivery/cqt-css', name),
      'utf8'
    );
  const config = (variantId: string, file: string): VariantCssConfig => ({
    variantId,
    variantClass: `variant-${variantId}`,
    sourceUrl: '',
    cssText: sheet(file),
  });
  const keyed = `.mc-populated-blank-root:where([data-mpb-css="${VARIANT_CSS_KEY}"])`;

  it("marks the root with this build's CSS key", async () => {
    const el = await mount({ customType: 'sel_vic' });
    expect(root(el).getAttribute('data-mpb-css')).toBe(VARIANT_CSS_KEY);
  });

  it('narrows every root selector of a sheet to roots carrying the key', () => {
    const css = keyVariantCss(sheet('sel-r1-base.css'));
    const roots = css.match(/\.mc-populated-blank-root(?![\w-])/g) || [];
    expect(roots.length).toBeGreaterThan(0);
    expect(css.split(keyed).length - 1).toBe(roots.length);
  });

  it('names the injected sheet after the variant and the key', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    ensureVariantCssInjected(config('sel-vic', 'sel-vic.css'), el);
    const style = document.head.querySelector('style[data-mpb-variant="sel-vic"]');
    expect(style?.id).toBe(`mc-populated-blank-css-sel-vic-${VARIANT_CSS_KEY}`);
    expect(style?.textContent).toContain(keyed);
  });

  it('injects the sheets into the shadow root the element renders in', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const el = document.createElement('div');
    shadow.appendChild(el);

    ensureVariantCssInjected(config('sel-r1-plusggg', 'sel-r1-plusggg.css'), el);

    const inShadow = [...shadow.querySelectorAll('style[data-mpb-variant]')].map((s) =>
      s.getAttribute('data-mpb-variant')
    );
    expect(inShadow).toEqual(['sel-r1-base', 'sel-r1-plusggg']);
    expect(document.head.querySelector('style[data-mpb-variant]')).toBeNull();
  });

  it('injects each sheet once for several instances', () => {
    for (let i = 0; i < 2; i++) {
      const el = document.createElement('div');
      document.body.appendChild(el);
      ensureVariantCssInjected(config('sel-vic', 'sel-vic.css'), el);
    }
    expect(document.head.querySelectorAll('style[data-mpb-variant="sel-vic"]')).toHaveLength(1);
  });
});
