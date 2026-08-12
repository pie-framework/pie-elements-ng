/**
 * Delivery renders no transcript.
 *
 * The transcript is an accessibility-catalog alternate: on `pie-section-player`
 * the assessment toolkit resolves the card against the learner's profile and
 * renders it in a labelled region above this element (PIE-902). An element-owned
 * copy would be a second source of the same text, would need the host to reveal
 * it through an element-specific CSS class, and would have to be reimplemented by
 * every element that carries audio.
 *
 * `model.audioTranscript` therefore stays on the model — the print view has no
 * toolkit and renders it, and the Learnosity import writes the card from it — but
 * nothing in delivery reads it.
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

describe('McPopulatedBlank — transcript is not delivered by the element', () => {
  it('renders no transcript node even when the model carries the text', () => {
    const { target, component } = mountComponent();
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-transcript')).toBeNull();
    expect(target.textContent).not.toContain(BASE_MODEL.audioTranscript);
  });

  it('describes its content by the prompt alone, with no transcript reference', () => {
    const { target, component } = mountComponent({ prompt: '<p>Pick one</p>' });
    mounts.push({ target, component });
    flushSync();
    const describedBy = Array.from(target.querySelectorAll('[aria-describedby]')).flatMap((el) =>
      (el.getAttribute('aria-describedby') || '').split(/\s+/)
    );
    expect(describedBy.length).toBeGreaterThan(0);
    for (const id of describedBy) {
      expect(id).not.toContain('transcript');
    }
  });

  it('leaves the audio control undescribed, so nothing points at a node it does not own', () => {
    const { target, component } = mountComponent({ useFeatureButtonAudio: false });
    mounts.push({ target, component });
    flushSync();
    const audio = target.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio?.getAttribute('aria-describedby')).toBeNull();
  });

  it('renders the rest of the item unchanged when a transcript is present', () => {
    const { target, component } = mountComponent();
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-container')).not.toBeNull();
    expect(target.querySelectorAll('.pie-choice').length).toBe(3);
  });
});
