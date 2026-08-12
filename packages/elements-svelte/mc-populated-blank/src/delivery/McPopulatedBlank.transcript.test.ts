/**
 * Transcript DOM contract for mc-populated-blank.
 *
 * The transcript is always rendered and always described-by-referenced; whether
 * it is *visible* is decided by CSS from an ancestor `.rli-with-audio-transcript`
 * and cannot be asserted here — component styles are not applied under
 * happy-dom. Visibility is covered by the parity e2e specs
 * (`apps/learnosity-parity-demo/test/e2e/mc-populated-blank-transcript-parity.spec.ts`).
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
  hasAudio: true,
  audioUrl: 'https://example.com/audio.mp3',
  audioTranscript: 'The word is look. Pick the correct spelling of the word look.',
  interactionMode: 'populate_blank',
  sentenceHtml: '',
  layoutProfile: 'audio_blank_only',
  customType: 'sel_r1-_plusggg',
  useFeatureButtonAudio: true,
  choiceLayout: 'horizontal',
  autoplayAudioEnabled: false,
  completeAudioEnabled: false,
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

describe('McPopulatedBlank — transcript rendering', () => {
  it('renders transcript in the DOM when audioTranscript is set', () => {
    const { target, component } = mountComponent();
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-transcript')).not.toBeNull();
  });

  it('transcript text has no label prefix', () => {
    const { target, component } = mountComponent();
    mounts.push({ target, component });
    flushSync();
    const transcript = target.querySelector('.pie-audio-transcript');
    expect(transcript?.textContent?.trim()).not.toMatch(/^Transcript:/i);
  });

  it('transcript contains the audioTranscript text', () => {
    const { target, component } = mountComponent();
    mounts.push({ target, component });
    flushSync();
    const transcript = target.querySelector('.pie-audio-transcript');
    expect(transcript?.textContent).toContain(BASE_MODEL.audioTranscript);
  });

  it('omits transcript element when audioTranscript is empty', () => {
    const { target, component } = mountComponent({ audioTranscript: '' });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-transcript')).toBeNull();
  });

  it('transcript renders before the first choice tile', () => {
    const { target, component } = mountComponent();
    mounts.push({ target, component });
    flushSync();
    const all = Array.from(target.querySelectorAll('.pie-audio-transcript, .pie-choice'));
    expect(all[0].classList.contains('pie-audio-transcript')).toBe(true);
  });

  it('transcript id is referenced by aria-describedby so it is announced while hidden', () => {
    const { target, component } = mountComponent();
    mounts.push({ target, component });
    flushSync();
    const transcriptId = target.querySelector('.pie-audio-transcript')?.id;
    expect(transcriptId).toBeTruthy();
    const describedBy = Array.from(target.querySelectorAll('[aria-describedby]')).flatMap((el) =>
      (el.getAttribute('aria-describedby') || '').split(/\s+/)
    );
    expect(describedBy).toContain(transcriptId);
  });

  it('renders the same markup with and without the reveal class on an ancestor', async () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const target = document.createElement('div');
    wrapper.appendChild(target);
    const component = mount(McPopulatedBlank as any, {
      target,
      props: { model: { ...BASE_MODEL }, session: {} },
    });
    mounts.push({ target, component });
    flushSync();

    const transcript = target.querySelector('.pie-audio-transcript');
    const before = transcript?.className;

    wrapper.classList.add('rli-with-audio-transcript');
    await new Promise((r) => setTimeout(r, 0));
    flushSync();

    // No class toggling, no ancestor observer: the reveal is a CSS rule keyed on
    // the ancestor, so the element's own attributes must not change.
    expect(transcript?.className).toBe(before);
    expect(transcript?.classList.contains('sr-only')).toBe(false);
    wrapper.remove();
  });
});
