import { afterEach, describe, expect, it, vi } from 'vitest';

import PiePassage from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object };

customElements.define('test-passage-panel-role', PiePassage as unknown as CustomElementConstructor);

const passage = (name: string) => ({ label: name, title: name, text: `<p>${name} text</p>` });

const mount = async (passages: object[]) => {
  const el = document.createElement('test-passage-panel-role') as Host;
  document.body.appendChild(el);
  el.model = { passages };
  await vi.waitFor(() => expect(el.querySelector('.tabpanel-0')).not.toBeNull());
  return el;
};

const roles = (el: HTMLElement) => [...el.querySelectorAll('[role]')].map((node) => node.getAttribute('role'));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('passage panel role', () => {
  it('leave a single passage without tab roles or a label reference', async () => {
    const el = await mount([passage('Only')]);
    const panel = el.querySelector('.tabpanel-0') as HTMLElement;

    expect(roles(el)).not.toContain('tablist');
    expect(roles(el)).not.toContain('tab');
    expect(roles(el)).not.toContain('tabpanel');
    expect(panel.hasAttribute('aria-labelledby')).toBe(false);
    expect(panel.textContent).toContain('Only text');
  });

  it('keep the tabpanel role, labelled by its tab, when tabs render', async () => {
    const el = await mount([passage('One'), passage('Two')]);
    const panel = el.querySelector('.tabpanel-0') as HTMLElement;
    const label = panel.getAttribute('aria-labelledby') as string;

    expect(panel.getAttribute('role')).toBe('tabpanel');
    expect(document.getElementById(label)?.getAttribute('role')).toBe('tab');
  });
});
