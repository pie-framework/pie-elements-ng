import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import AudioPlayer from './AudioPlayer.svelte';

const BASE_PROPS = {
  hasAudio: true,
  audioUrl: 'https://example.com/audio.mp3',
  useFeatureButtonAudio: false,
  autoplayEnabled: false,
  audioTranscript: 'The word is look.',
  showVisibleTranscript: false,
  transcriptId: 'test-transcript',
  featureAudioSkin: { silentUrl: '', playingUrl: '' },
  uiText: {
    clickToEnableAutoplay: 'Click to enable',
    transcriptLabel: 'Transcript',
    audioResourceUnavailable: 'Unavailable',
    listenSilentAlt: 'Repeat instructions',
    listenPlayingAlt: 'Instructions are playing',
    listenSilentAltEs: 'Escuchar. Repetir las instrucciones.',
    listenPlayingAltEs: 'Escuchar. Estas son las instrucciones.',
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
  it('renders native controls when hasAudio=true and useFeatureButtonAudio=false', () => {
    const { target, component } = mountPlayer({ useFeatureButtonAudio: false });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-player')).not.toBeNull();
  });

  it('renders nothing when hasAudio is false', () => {
    const { target, component } = mountPlayer({ hasAudio: false });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-container')).toBeNull();
  });

  it('renders an error message when hasAudio=true but audioUrl is missing', () => {
    const { target, component } = mountPlayer({ audioUrl: undefined });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-audio-error')).not.toBeNull();
  });

  it('renders the feature button when useFeatureButtonAudio=true', () => {
    const { target, component } = mountPlayer({ useFeatureButtonAudio: true });
    mounts.push({ target, component });
    flushSync();
    expect(target.querySelector('.pie-listen-button')).not.toBeNull();
  });

  it('silent image alt is "Repeat instructions" in feature-button mode', () => {
    const { target, component } = mountPlayer({ useFeatureButtonAudio: true });
    mounts.push({ target, component });
    flushSync();
    const imgs = target.querySelectorAll('.pie-listen-icon');
    const alts = Array.from(imgs).map((el) => (el as HTMLImageElement).alt);
    expect(alts).toContain('Repeat instructions');
  });

  it('playing image alt is "Instructions are playing" in feature-button mode', () => {
    const { target, component } = mountPlayer({ useFeatureButtonAudio: true });
    mounts.push({ target, component });
    flushSync();
    const imgs = target.querySelectorAll('.pie-listen-icon');
    const alts = Array.from(imgs).map((el) => (el as HTMLImageElement).alt);
    expect(alts).toContain('Instructions are playing');
  });
});

describe('AudioPlayer — autoplay-blocked prompt', () => {
  it('shows pie-audio-autoplay-enable when autoplay is blocked by the browser', async () => {
    // Override HTMLAudioElement.play on the global so all audio elements reject
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException('autoplay blocked', 'NotAllowedError'));

    const { target, component } = mountPlayer({
      useFeatureButtonAudio: false,
      autoplayEnabled: true,
    });
    mounts.push({ target, component });
    flushSync();

    // Allow the rejected promise microtask to settle
    await Promise.resolve();
    flushSync();

    expect(target.querySelector('.pie-audio-autoplay-enable')).not.toBeNull();

    HTMLMediaElement.prototype.play = originalPlay;
  });

  it('hides pie-audio-autoplay-enable when autoplay is not blocked', async () => {
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = () => Promise.resolve();

    const { target, component } = mountPlayer({
      useFeatureButtonAudio: false,
      autoplayEnabled: true,
    });
    mounts.push({ target, component });
    flushSync();
    await Promise.resolve();
    flushSync();

    expect(target.querySelector('.pie-audio-autoplay-enable')).toBeNull();

    HTMLMediaElement.prototype.play = originalPlay;
  });

  it('pie-audio-autoplay-enable is not rendered in feature-button mode even when autoplay is blocked', async () => {
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException('autoplay blocked', 'NotAllowedError'));

    const { target, component } = mountPlayer({
      useFeatureButtonAudio: true,
      autoplayEnabled: true,
    });
    mounts.push({ target, component });
    flushSync();
    await Promise.resolve();
    flushSync();

    // Feature-button mode never shows the enable-autoplay prompt
    expect(target.querySelector('.pie-audio-autoplay-enable')).toBeNull();

    HTMLMediaElement.prototype.play = originalPlay;
  });
});
