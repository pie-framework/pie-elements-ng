/**
 * Teacher instructions, the prompt and the show-correct-answer toggle render in one
 * header block before the stem, which each grid layout places in a row above it.
 * An imported prompt can be an empty wrapper: it renders nothing, and the choices
 * keep their own label.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import McPopulatedBlank from './McPopulatedBlank.svelte';

const BASE_MODEL = {
  id: '1',
  element: 'mc-populated-blank',
  template: '<span>Select a word that describes the sun.</span> {{blank}}',
  choiceMode: 'text',
  choices: [
    { id: 'A', labelHtml: 'went' },
    { id: 'B', labelHtml: 'day' },
    { id: 'C', labelHtml: 'bright' },
  ],
  correctChoiceId: 'C',
  hasAudio: true,
  audioUrl: 'https://example.com/audio.mp3',
  useFeatureButtonAudio: true,
  interactionMode: 'populate_blank',
  layoutProfile: 'inline_sentence',
  customType: 'sel_r1-g_plusggg',
  choiceLayout: 'horizontal',
  prompt: '',
  mode: 'gather',
};

const PASSAGE =
  '<div class="iat-html-container"><p class="iat-align-center"><strong>A Beautiful Day</strong></p><p>I went outside.</p></div>';
const EMPTY_WRAPPER =
  '<div class="iat-html-container iat-stacking-boundary"><div class="hvr-script-audio"><p>&nbsp;</p></div></div>';

const mounts: Array<{ target: HTMLElement; component: ReturnType<typeof mount> }> = [];

function render(overrides: Record<string, unknown>, session: Record<string, unknown> = {}) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(McPopulatedBlank as any, {
    target,
    props: { model: { ...BASE_MODEL, ...overrides }, session },
  });
  mounts.push({ target, component });
  flushSync();
  return {
    root: target.querySelector('.mc-populated-blank-root') as HTMLElement,
    header: target.querySelector('.pie-header'),
    group: target.querySelector('[role="radiogroup"]') as HTMLElement,
  };
}

afterEach(() => {
  for (const { target, component } of mounts.splice(0)) {
    unmount(component);
    target.remove();
  }
});

describe('McPopulatedBlank — header', () => {
  it('holds a prompt with content, which labels the choices', () => {
    const { root, header, group } = render({ prompt: PASSAGE });
    const prompt = header?.querySelector('.pie-prompt');
    expect(root.classList.contains('has-header')).toBe(true);
    expect(prompt?.textContent).toContain('A Beautiful Day');
    expect(group.getAttribute('aria-labelledby')).toBe(prompt?.id);
  });

  it('does not render for an empty prompt wrapper, and the choices keep their own name', () => {
    const { root, header, group } = render({ prompt: EMPTY_WRAPPER });
    expect(root.classList.contains('has-header')).toBe(false);
    expect(header).toBeNull();
    expect(root.querySelector('.pie-prompt')).toBeNull();
    expect(group.hasAttribute('aria-labelledby')).toBe(false);
    expect(group.getAttribute('aria-label')).toBeTruthy();
    for (const el of root.querySelectorAll('[aria-describedby]')) {
      for (const id of (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    }
  });

  it('holds the show-correct-answer toggle for an incorrect response', () => {
    const { root, header } = render(
      { prompt: EMPTY_WRAPPER, mode: 'evaluate', correctness: 'incorrect' },
      { value: ['A'] }
    );
    expect(root.classList.contains('has-header')).toBe(true);
    expect(header?.querySelector('[data-testid="show-correct-answer"]')).not.toBeNull();
  });

  it('holds teacher instructions ahead of the prompt', () => {
    const { header } = render({ prompt: PASSAGE, teacherInstructions: '<p>Read aloud.</p>' });
    const blocks = [...(header?.children ?? [])].map((el) => el.className);
    expect(blocks[0]).toContain('pie-teacher-instructions');
    expect(blocks[1]).toContain('pie-prompt');
  });
});
