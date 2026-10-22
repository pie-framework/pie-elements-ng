import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  autoplayAudioOn,
  bindPromptAudio,
  type PromptAudioSettings,
  type PromptAudioTiming,
  PromptAudioTracker,
  PromptAudioWatcher,
  promptAudioPending,
  withPromptAudioTiming,
} from '../src/prompt-audio';

const root = (html: string) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
};

const PROMPT = '<div class="preview-prompt"><audio><source src="a.mp3"></audio></div>';

function tracker(session: PromptAudioTiming | null = {}) {
  const host = {
    session: vi.fn(() => session),
    writeSession: vi.fn((next: PromptAudioTiming) => {
      session = next;
    }),
    announce: vi.fn(),
  };
  return { tracker: new PromptAudioTracker(host), host, session: () => session };
}

describe('autoplayAudioOn', () => {
  it.each([
    [{}, false],
    [{ autoplayAudioEnabled: true }, true],
    [{ autoplayAudioEnabled: true, autoplayAudioHeld: true }, false],
    [{ autoplayAudioHeld: true }, false],
  ])('%o -> %s', (fields, expected) => {
    expect(autoplayAudioOn(fields)).toBe(expected);
  });
});

describe('withPromptAudioTiming', () => {
  it('records the first playback and its wait time', () => {
    const started = withPromptAudioTiming({ value: 1 }, { audioStartTime: 1000 });
    const ended = withPromptAudioTiming(started, { audioEndTime: 4000 });

    expect(ended).toEqual({ value: 1, audioStartTime: 1000, audioEndTime: 4000, waitTime: 3000 });
  });

  it('keeps the first playback through a replay', () => {
    const played = { audioStartTime: 1000, audioEndTime: 4000, waitTime: 3000 };

    expect(withPromptAudioTiming(played, { audioStartTime: 9000 })).toEqual(played);
    expect(withPromptAudioTiming(played, { audioEndTime: 9000 })).toEqual(played);
  });
});

describe('PromptAudioTracker', () => {
  it('writes timing into the session and announces the end once', () => {
    const { tracker: t, host, session } = tracker();

    t.recordStart(1000);
    expect(host.announce).not.toHaveBeenCalled();
    t.recordEnd(4000);
    t.recordStart(5000);
    t.recordEnd(8000);

    expect(session()).toEqual({ audioStartTime: 1000, audioEndTime: 4000, waitTime: 3000 });
    expect(host.writeSession).toHaveBeenCalledTimes(2);
    expect(host.announce).toHaveBeenCalledTimes(1);
    expect(t.hasEnded).toBe(true);
  });

  it('waits until the audio ends, fails, or a resumed session records it played', () => {
    expect(tracker().tracker.pending).toBe(true);
    expect(tracker({ audioEndTime: 1 }).tracker.pending).toBe(false);

    const ended = tracker().tracker;
    ended.recordEnd();
    expect(ended.pending).toBe(false);

    const { tracker: failed, host } = tracker();
    failed.recordFailure();
    failed.recordFailure();
    expect(failed.pending).toBe(false);
    expect(failed.hasFailed).toBe(true);
    expect(host.announce).toHaveBeenCalledTimes(1);
  });

  it('lets a host count the audio as played without timing or an announcement', () => {
    const { tracker: t, host } = tracker();

    t.markPlayed();
    expect(t.pending).toBe(false);
    t.markPlayed(false);
    expect(t.pending).toBe(true);

    expect(host.writeSession).not.toHaveBeenCalled();
    expect(host.announce).not.toHaveBeenCalled();
  });

  it('starts over for another source and keeps the state for the same one', () => {
    const { tracker: t } = tracker(null);
    t.follow('a.mp3');
    t.recordEnd();

    t.follow('a.mp3');
    expect(t.hasEnded).toBe(true);

    t.follow('b.mp3');
    expect(t.hasEnded).toBe(false);
  });
});

describe('bindPromptAudio', () => {
  it('feeds playback and load failure into the tracker until unbound', () => {
    const el = root(PROMPT);
    const audio = el.querySelector('audio') as HTMLAudioElement;
    const { tracker: t, host, session } = tracker();
    const unbind = bindPromptAudio(audio, t);

    audio.dispatchEvent(new Event('playing'));
    audio.dispatchEvent(new Event('ended'));
    expect(session()).toEqual(
      expect.objectContaining({
        audioStartTime: expect.any(Number),
        audioEndTime: expect.any(Number),
      })
    );

    (audio.querySelector('source') as HTMLSourceElement).dispatchEvent(new Event('error'));
    expect(t.hasFailed).toBe(true);
    expect(host.announce).toHaveBeenCalledTimes(2);

    unbind();
    t.follow('other.mp3');
    audio.dispatchEvent(new Event('ended'));
    expect(t.hasEnded).toBe(false);
  });
});

describe('promptAudioPending', () => {
  it('waits on prompt audio with a source', () => {
    expect(promptAudioPending(root(PROMPT), tracker().tracker)).toBe(true);
    expect(
      promptAudioPending(
        root('<div class="preview-prompt"><audio src="a.mp3"></audio></div>'),
        tracker().tracker
      )
    ).toBe(true);
  });

  it.each([
    ['no audio', '<div class="preview-prompt"></div>'],
    ['audio outside the prompt', '<audio src="a.mp3"></audio>'],
    ['audio without a source', '<div class="preview-prompt"><audio><source src=""></audio></div>'],
  ])('does not wait with %s', (_, html) => {
    expect(promptAudioPending(root(html), tracker().tracker)).toBe(false);
  });

  it('does not wait once the tracker has settled the audio', () => {
    const { tracker: t } = tracker();
    t.recordEnd();

    expect(promptAudioPending(root(PROMPT), t)).toBe(false);
    expect(promptAudioPending(root(PROMPT), tracker({ audioEndTime: 1 }).tracker)).toBe(false);
  });
});

describe('PromptAudioWatcher', () => {
  const MARKUP =
    '<div class="main-container"><div class="preview-prompt"><audio src="a.mp3"></audio></div></div>';

  let element: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  function watch(settings: PromptAudioSettings) {
    const t = tracker();
    const watcher = new PromptAudioWatcher({
      root: element,
      tracker: t.tracker,
      settings: () => settings,
      enableAudioImage: 'enable.png',
    });
    watcher.connect();
    return { ...t, watcher };
  }

  const audio = () => element.querySelector('audio') as HTMLAudioElement;
  const toast = () => element.querySelector('.play-audio-info');

  it('binds the prompt audio once it renders', async () => {
    const { tracker: t } = watch({ completeAudioEnabled: true });
    element.innerHTML = MARKUP;
    await Promise.resolve();

    audio().dispatchEvent(new Event('ended'));

    expect(t.hasEnded).toBe(true);
  });

  it('binds prompt audio already rendered when it connects', () => {
    element.innerHTML = MARKUP;
    const { tracker: t } = watch({ completeAudioEnabled: true });

    audio().dispatchEvent(new Event('ended'));

    expect(t.hasEnded).toBe(true);
  });

  it('tracks nothing while neither setting is on', () => {
    element.innerHTML = MARKUP;
    const { tracker: t } = watch({});

    audio().dispatchEvent(new Event('ended'));
    vi.advanceTimersByTime(600);

    expect(t.hasEnded).toBe(false);
    expect(toast()).toBeNull();
  });

  it('offers to start blocked autoplay, and starts it on the next click', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    element.innerHTML = MARKUP;
    watch({ autoplayAudioEnabled: true });

    vi.advanceTimersByTime(600);
    expect(toast()?.parentElement).toBe(element.querySelector('.main-container'));

    document.body.click();

    expect(play.mock.contexts).toContain(audio());
    expect(toast()).toBeNull();
  });

  it('offers nothing when autoplay is held, or once the audio plays', () => {
    element.innerHTML = MARKUP;
    watch({ autoplayAudioEnabled: true, autoplayAudioHeld: true, completeAudioEnabled: true });
    vi.advanceTimersByTime(600);
    expect(toast()).toBeNull();

    document.body.innerHTML = '';
    element = document.createElement('div');
    document.body.appendChild(element);
    element.innerHTML = MARKUP;
    watch({ autoplayAudioEnabled: true });
    vi.advanceTimersByTime(600);
    audio().dispatchEvent(new Event('playing'));
    expect(toast()).toBeNull();
  });

  it('rebinds when the element renders audio with another source, and lets go on disconnect', async () => {
    element.innerHTML = MARKUP;
    const { tracker: t, watcher } = watch({ completeAudioEnabled: true });
    audio().dispatchEvent(new Event('ended'));

    element.innerHTML = MARKUP.replace('a.mp3', 'b.mp3');
    await Promise.resolve();
    expect(t.hasEnded).toBe(false);

    watcher.disconnect();
    audio().dispatchEvent(new Event('ended'));
    expect(t.hasEnded).toBe(false);
  });

  it('keeps a finished playback when the element re-renders the same audio', async () => {
    element.innerHTML = MARKUP;
    const { tracker: t } = watch({ completeAudioEnabled: true });
    audio().dispatchEvent(new Event('ended'));

    element.innerHTML = MARKUP;
    await Promise.resolve();

    expect(t.hasEnded).toBe(true);
  });
});
