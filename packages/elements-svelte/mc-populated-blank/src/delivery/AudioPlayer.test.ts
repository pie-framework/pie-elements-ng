import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import AudioPlayer from './AudioPlayer.svelte';

const BASE_PROPS = {
  audioMode: 'controls' as const,
  audioUrl: 'https://example.com/audio.mp3',
  audioTranscript: 'The word is look.',
  showVisibleTranscript: false,
  transcriptId: 'test-transcript',
  featureAudioSkin: { silentUrl: '', playingUrl: '' },
  autoPlayPromptOpen: false,
  isMediaPlaying: false,
  audioErrorMessage: '',
  uiText: {
    clickToEnableAutoplay: 'Click to enable',
    transcriptLabel: 'Transcript',
    audioResourceUnavailable: 'Unavailable',
  },
};

function mountPlayer(props: Partial<typeof BASE_PROPS>) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(AudioPlayer, { target, props: { ...BASE_PROPS, ...props } });
  return { target, component };
}

const mounts: Array<{ target: HTMLElement; component: ReturnType<typeof mount> }> = [];

afterEach(() => {
  for (const { target, component } of mounts.splice(0)) {
    unmount(component);
    target.remove();
  }
});

describe('AudioPlayer — transcript visibility', () => {
  it('renders transcript text in the DOM when audioTranscript is provided', () => {
    const { target, component } = mountPlayer({ showVisibleTranscript: false });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-transcript')).not.toBeNull();
    expect(target.textContent).toContain('The word is look.');
  });

  it('hides transcript visually with sr-only when showVisibleTranscript is false', () => {
    const { target, component } = mountPlayer({ showVisibleTranscript: false });
    mounts.push({ target, component });
    flushSync();
    const transcript = target.querySelector('.pie-audio-transcript');
    expect(transcript).not.toBeNull();
    expect(transcript!.classList.contains('sr-only')).toBe(true);
  });

  it('shows transcript visually when showVisibleTranscript is true', () => {
    const { target, component } = mountPlayer({ showVisibleTranscript: true });
    mounts.push({ target, component });
    flushSync();
    const transcript = target.querySelector('.pie-audio-transcript');
    expect(transcript).not.toBeNull();
    expect(transcript!.classList.contains('sr-only')).toBe(false);
  });

  it('labels transcript with the transcriptLabel from uiText', () => {
    const { target, component } = mountPlayer({ showVisibleTranscript: true });
    mounts.push({ target, component });
    flushSync();
    const transcript = target.querySelector('.pie-audio-transcript');
    expect(transcript?.textContent).toContain('Transcript:');
  });

  it('omits transcript element entirely when audioTranscript is empty', () => {
    const { target, component } = mountPlayer({ audioTranscript: '', showVisibleTranscript: true });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-transcript')).toBeNull();
  });

  it('transcript element has the correct id for aria-describedby', () => {
    const { target, component } = mountPlayer({ transcriptId: 'aria-target' });
    mounts.push({ target, component });
    flushSync();
    const transcript = target.querySelector('.pie-audio-transcript');
    expect(transcript?.id).toBe('aria-target');
  });
});
