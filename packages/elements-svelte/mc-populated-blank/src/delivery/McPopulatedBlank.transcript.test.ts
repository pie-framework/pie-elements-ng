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
  showVisibleTranscript: false,
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

  it('hides transcript with sr-only when showVisibleTranscript is false', () => {
    const { target, component } = mountComponent({ showVisibleTranscript: false });
    mounts.push({ target, component });
    flushSync();
    const transcript = target.querySelector('.pie-audio-transcript');
    expect(transcript?.classList.contains('sr-only')).toBe(true);
  });

  it('shows transcript without sr-only when ancestor has rli-with-audio-transcript class', async () => {
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

    wrapper.classList.add('rli-with-audio-transcript');
    await new Promise((r) => setTimeout(r, 0));
    flushSync();

    const transcript = target.querySelector('.pie-audio-transcript');
    expect(transcript?.classList.contains('sr-only')).toBe(false);
    wrapper.remove();
  });

  it('transcript text has no label prefix', async () => {
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

    wrapper.classList.add('rli-with-audio-transcript');
    await new Promise((r) => setTimeout(r, 0));
    flushSync();

    const transcript = target.querySelector('.pie-audio-transcript');
    expect(transcript?.textContent?.trim()).not.toMatch(/^Transcript:/i);
    wrapper.remove();
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

  it('shows transcript when ancestor gains rli-with-audio-transcript class', async () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const target = document.createElement('div');
    wrapper.appendChild(target);
    const component = mount(McPopulatedBlank as any, {
      target,
      props: { model: { ...BASE_MODEL, showVisibleTranscript: false }, session: {} },
    });
    mounts.push({ target, component });
    flushSync();

    const transcript = target.querySelector('.pie-audio-transcript');
    expect(transcript?.classList.contains('sr-only')).toBe(true);

    wrapper.classList.add('rli-with-audio-transcript');
    // Allow MutationObserver microtask to fire
    await new Promise((r) => setTimeout(r, 0));
    flushSync();

    expect(transcript?.classList.contains('sr-only')).toBe(false);
    wrapper.remove();
  });
});
