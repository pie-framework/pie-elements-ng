import { afterEach, describe, expect, it, vi } from 'vitest';

import PiePassage from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object };

customElements.define('test-passage-language', PiePassage as unknown as CustomElementConstructor);

const passage = (name: string) => ({ label: name, title: name, text: `<p>${name} text</p>` });

const mount = async (model: object) => {
  const el = document.createElement('test-passage-language') as Host;
  document.body.appendChild(el);
  el.model = model;
  await vi.waitFor(() => expect(el.querySelector('.tabpanel-0')).not.toBeNull());
  return el;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('passage language stamp', () => {
  it('stamps the declared language, canonicalized, with its direction', async () => {
    const el = await mount({ language: 'es_MX', passages: [passage('Only')] });
    expect(el.getAttribute('lang')).toBe('es-MX');
    expect(el.getAttribute('dir')).toBe('ltr');
  });

  it('stamps a right-to-left declared language with dir', async () => {
    const el = await mount({ language: 'ar-SA', passages: [passage('Only')] });
    expect(el.getAttribute('lang')).toBe('ar-SA');
    expect(el.getAttribute('dir')).toBe('rtl');
  });

  it('asserts nothing when the item declares no language', async () => {
    const el = await mount({ passages: [passage('Only')] });
    expect(el.getAttribute('lang')).toBeNull();
    expect(el.getAttribute('dir')).toBeNull();
  });

  it('removes a stale stamp when a model set drops the language', async () => {
    const el = await mount({ language: 'es-MX', passages: [passage('Only')] });
    expect(el.getAttribute('lang')).toBe('es-MX');

    el.model = { passages: [passage('Only')] };
    await vi.waitFor(() => expect(el.getAttribute('lang')).toBeNull());
    expect(el.getAttribute('dir')).toBeNull();
  });

  it('treats a non-tag declaration as no declaration', async () => {
    const el = await mount({ language: 'Spanish', passages: [passage('Only')] });
    expect(el.getAttribute('lang')).toBeNull();
    expect(el.getAttribute('dir')).toBeNull();
  });
});
