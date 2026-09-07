/**
 * Screen reader users need to know, before making a choice, that whatever
 * they pick will appear on the blank line above the choices — otherwise the
 * live-region update on the blank slot is easy to miss (PIE a11y direction
 * from Amber: static sr-only hint, same fallback Star uses for unreliable
 * aria-live in Learnosity).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import McPopulatedBlank from './McPopulatedBlank.svelte';

const BASE_MODEL = {
  id: '1',
  element: 'mc-populated-blank',
  template: '<p>{{blank}}</p>',
  choiceMode: 'text',
  choices: [
    { id: 'a', labelHtml: 'louk' },
    { id: 'b', labelHtml: 'lok' },
    { id: 'c', labelHtml: 'look' },
  ],
  correctChoiceId: 'c',
  interactionMode: 'populate_blank',
  sentenceHtml: '',
  layoutProfile: '',
  mode: 'gather',
};

function mountComponent(modelOverrides: Record<string, unknown> = {}) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(McPopulatedBlank as any, {
    target,
    props: { model: { ...BASE_MODEL, ...modelOverrides }, session: {} },
  });
  return { target, component };
}

const mounts: Array<{ target: HTMLElement; component: ReturnType<typeof mount> }> = [];

afterEach(() => {
  for (const { target, component } of mounts.splice(0)) {
    unmount(component);
    target.remove();
  }
});

describe('McPopulatedBlank — pre-selection blank hint', () => {
  it('renders a static sr-only hint telling the student where their answer will appear', () => {
    const { target, component } = mountComponent();
    mounts.push({ target, component });
    flushSync();
    const hint = target.querySelector('.pie-blank-hint');
    expect(hint).not.toBeNull();
    expect(hint?.textContent).toBe(
      'The answer you choose will appear on the blank line above.'
    );
  });

  it('describes the radiogroup with the blank hint', () => {
    const { target, component } = mountComponent();
    mounts.push({ target, component });
    flushSync();
    const hint = target.querySelector('.pie-blank-hint') as HTMLElement;
    const radiogroup = target.querySelector('[role="radiogroup"]') as HTMLElement;
    const describedBy = (radiogroup.getAttribute('aria-describedby') || '').split(/\s+/);
    expect(describedBy).toContain(hint.id);
  });

  it('honors a custom blankPreSelectionHint from uiText', () => {
    const { target, component } = mountComponent({
      uiText: { blankPreSelectionHint: 'Your pick shows up above.' },
    });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-blank-hint')?.textContent).toBe('Your pick shows up above.');
  });
});
