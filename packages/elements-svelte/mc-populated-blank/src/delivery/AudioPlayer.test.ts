import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import AudioPlayer from './AudioPlayer.svelte';
import type { AudioMode } from './computeAudioMode';

const BASE_PROPS = {
  audioMode: 'controls' as AudioMode,
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

describe('AudioPlayer — audio element', () => {
  it('renders an audio element in controls mode', () => {
    const { target, component } = mountPlayer({ audioMode: 'controls' });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-player')).not.toBeNull();
  });

  it('renders nothing when audioMode is none', () => {
    const { target, component } = mountPlayer({ audioMode: 'none' as const });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-container')).toBeNull();
  });

  it('renders an error message when audioMode is error', () => {
    const { target, component } = mountPlayer({
      audioMode: 'error' as const,
      audioErrorMessage: 'Unavailable',
    });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-error')).not.toBeNull();
  });

  it('renders the feature button in feature-button mode', () => {
    const { target, component } = mountPlayer({ audioMode: 'feature-button' as const });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-listen-button')).not.toBeNull();
  });
});
