import { afterEach, describe, expect, it, vi } from 'vitest';

import PassagePrint from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object; options: object };

customElements.define('test-passage-print-panel-ids', PassagePrint as unknown as CustomElementConstructor);

const mount = async (name: string) => {
  const el = document.createElement('test-passage-print-panel-ids') as Host;
  el.options = { role: 'student' };
  document.body.appendChild(el);
  el.model = {
    passages: [
      { title: `${name} one`, text: `<p>${name} one text</p>` },
      { title: `${name} two`, text: `<p>${name} two text</p>` },
    ],
  };
  await vi.waitFor(() => expect(el.querySelectorAll('[class*="tabpanel-"]')).toHaveLength(2));
  return el;
};

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((node) => node.id);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('passage print panel ids', () => {
  it('repeat no id when two printed passages share a page', async () => {
    await mount('A');
    await mount('B');

    expect(ids(document).length).toBeGreaterThan(0);
    expect(new Set(ids(document)).size).toBe(ids(document).length);
  });

  // Print renders no tab buttons, so no panel may claim to be a tab panel or point at one.
  it('render the panels without the tabpanel role or a label reference', async () => {
    const el = await mount('A');

    expect(el.querySelector('[role="tabpanel"], [role="tab"], [aria-labelledby]')).toBeNull();
  });
});
