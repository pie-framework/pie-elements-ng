import { afterEach, describe, expect, it, vi } from 'vitest';

import PiePassage from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object };

customElements.define('test-passage-tab-ids', PiePassage as unknown as CustomElementConstructor);

const model = (name: string, extra: object = {}) => ({
  passages: [
    { label: `${name} one`, title: `${name} one`, text: `<p>${name} one text</p>`, teacherInstructions: '<p>Read aloud.</p>' },
    { label: `${name} two`, title: `${name} two`, text: `<p>${name} two text</p>` },
  ],
  ...extra,
});

const mount = async (name: string) => {
  const el = document.createElement('test-passage-tab-ids') as Host;
  document.body.appendChild(el);
  el.model = model(name);
  await vi.waitFor(() => expect(el.querySelectorAll('[role="tab"]')).toHaveLength(2));
  return el;
};

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((node) => node.id);

const REFERENCE_ATTRIBUTES = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'for'];

const references = (root: ParentNode) =>
  [...root.querySelectorAll('*')].flatMap((node) =>
    REFERENCE_ATTRIBUTES.flatMap((name) =>
      (node.getAttribute(name) || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => ({ node, name, id })),
    ),
  );

const tabs = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('[role="tab"]')];

const panel = (el: HTMLElement) => el.querySelector('[role="tabpanel"]') as HTMLElement;

const press = (target: HTMLElement, key: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('passage tab ids', () => {
  it('repeat no id when two tabbed passages share a page', async () => {
    await mount('A');
    await mount('B');

    expect(ids(document).length).toBeGreaterThan(0);
    expect(new Set(ids(document)).size).toBe(ids(document).length);
  });

  it('keep the button-N and tabpanel-N classes on their own generated ids', async () => {
    const a = await mount('A');
    const b = await mount('B');

    for (const el of [a, b]) {
      expect(tabs(el)[0].classList).toContain('button-0');
      expect(tabs(el)[1].classList).toContain('button-1');
      expect(panel(el).classList).toContain('tabpanel-0');
      expect(panel(el).id).toMatch(/^passage-.+-tabpanel-0$/);
    }
    expect(tabs(a)[0].id).not.toBe(tabs(b)[0].id);
    expect(panel(a).id).not.toBe(panel(b).id);
  });

  // The browser resolves an id reference document-wide, to the first match. An unselected
  // tab's panel is not mounted, so its aria-controls dangles - axe allows that for
  // aria-selected="false" - but it must not resolve into the other passage either.
  it('resolve every reference inside its own passage', async () => {
    for (const el of [await mount('A'), await mount('B')]) {
      expect(references(el).length).toBeGreaterThan(0);
      for (const { node, name, id } of references(el)) {
        const target = document.getElementById(id);
        if (target) {
          expect(el.contains(target)).toBe(true);
        } else {
          expect({ name, selected: node.getAttribute('aria-selected') }).toEqual({ name: 'aria-controls', selected: 'false' });
        }
      }
    }
  });

  it('pair each tab with the panel it opens', async () => {
    const el = await mount('A');

    expect(panel(el).getAttribute('aria-labelledby')).toBe(tabs(el)[0].id);
    expect(tabs(el)[0].getAttribute('aria-controls')).toBe(panel(el).id);
  });

  it('move arrow-key focus only within its own passage', async () => {
    const a = await mount('A');
    const b = await mount('B');

    tabs(b)[0].focus();
    press(tabs(b)[0], 'ArrowRight');

    expect(document.activeElement).toBe(tabs(b)[1]);
    await vi.waitFor(() => expect(panel(b).textContent).toContain('B two text'));
    expect(panel(a).textContent).toContain('A one text');

    press(tabs(b)[1], 'Home');

    expect(document.activeElement).toBe(tabs(b)[0]);
  });

  it('keep their ids when the passage renders again', async () => {
    const el = await mount('A');
    const before = ids(el);

    el.model = model('A again');
    await vi.waitFor(() => expect(panel(el).textContent).toContain('A again one text'));

    expect(ids(el)).toEqual(before);
  });
});
