import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/render-ui', () => ({
  default: { EnableAudioAutoplayImage: () => null },
  EnableAudioAutoplayImage: () => null,
  createUniqueId: (prefix: string) => `${prefix}-test`,
}));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: MultipleChoice, isComplete } = await import('../src/delivery/index.js');
const { PromptAudioTracker } = await import('@pie-element/shared-utils');

const TAG = 'pie-multiple-choice-audio-complete-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, MultipleChoice as CustomElementConstructor);
}

const answered = { value: ['a'] };

function promptAudio(ended: boolean) {
  const tracker = new PromptAudioTracker({ session: () => null, writeSession: () => {}, announce: () => {} });
  if (ended) tracker.recordEnd();
  return tracker;
}

function contextWithPromptAudio() {
  const context = document.createElement('div');
  context.innerHTML = '<div class="preview-prompt"><audio src="prompt.mp3"></audio></div>';
  return context;
}

describe('isComplete audio requirement', () => {
  it.each([
    // autoplay, completeAudio, audioComplete, expected
    [false, true, false, false],
    [false, true, true, true],
    [true, true, false, false],
    [true, true, true, true],
    [false, false, false, true],
    [true, false, false, true],
  ])(
    'autoplay=%s completeAudio=%s audioComplete=%s -> %s',
    (autoplayAudioEnabled, completeAudioEnabled, audioComplete, expected) => {
      const model = { choiceMode: 'radio', autoplayAudioEnabled, completeAudioEnabled };

      expect(isComplete(answered, model, promptAudio(audioComplete), contextWithPromptAudio())).toBe(expected);
    },
  );

  it('still requires a response once the audio has finished', () => {
    const model = { choiceMode: 'radio', completeAudioEnabled: true };

    expect(isComplete({ value: [] }, model, promptAudio(true), contextWithPromptAudio())).toBe(false);
  });

  it('ignores completeAudioEnabled when the prompt has no audio', () => {
    const model = { choiceMode: 'radio', completeAudioEnabled: true };

    expect(isComplete(answered, model, promptAudio(false), document.createElement('div'))).toBe(true);
  });
});

describe('multiple-choice prompt audio tracking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  async function mount(modelFlags: Record<string, boolean>) {
    const element = document.createElement(TAG) as any;
    document.body.appendChild(element);
    element.model = {
      choiceMode: 'radio',
      prompt: 'p',
      language: 'en-US',
      choices: [{ value: 'a', label: 'A' }],
      ...modelFlags,
    };
    element.session = { value: ['a'] };
    vi.advanceTimersByTime(100);

    // Main is mocked, so stand in for the markup it renders around the prompt.
    element.innerHTML =
      '<div class="main-container"><div class="preview-prompt"><audio src="prompt.mp3"></audio></div></div>';
    await Promise.resolve();

    const events: CustomEvent[] = [];
    element.addEventListener('session-changed', (event: Event) => {
      events.push(event as CustomEvent);
    });
    const audio = element.querySelector('audio') as HTMLAudioElement;
    return { element, events, audio };
  }

  it('marks the item complete when the audio ends with autoplay off', async () => {
    const { element, events, audio } = await mount({
      autoplayAudioEnabled: false,
      completeAudioEnabled: true,
    });

    expect(isComplete(element.session, element._model, element.promptAudio, element)).toBe(false);

    audio.dispatchEvent(new Event('playing'));
    audio.dispatchEvent(new Event('ended'));
    vi.advanceTimersByTime(10);

    expect(element.promptAudio.hasEnded).toBe(true);
    expect(element.session.audioStartTime).toEqual(expect.any(Number));
    expect(element.session.audioEndTime).toEqual(expect.any(Number));
    expect(events.at(-1)?.detail.complete).toBe(true);
  });

  it('lets a host skip the wait through audioComplete', async () => {
    const { element } = await mount({ completeAudioEnabled: true });

    element.audioComplete = true;

    expect(isComplete(element.session, element._model, element.promptAudio, element)).toBe(true);
    expect(element.session.audioEndTime).toBeUndefined();
  });

  it('does not show the enable-autoplay overlay with autoplay off', async () => {
    const { element } = await mount({ autoplayAudioEnabled: false, completeAudioEnabled: true });

    vi.advanceTimersByTime(600);

    expect(element.querySelector('.play-audio-info')).toBeNull();
  });

  it('does not track the audio when neither flag is on', async () => {
    const { element, audio } = await mount({
      autoplayAudioEnabled: false,
      completeAudioEnabled: false,
    });

    audio.dispatchEvent(new Event('ended'));

    expect(element.promptAudio.hasEnded).toBe(false);
    expect(element.session.audioEndTime).toBeUndefined();
  });
});

describe('multiple-choice autoplay policy', () => {
  const PROMPT_AUDIO =
    '<div class="main-container"><div class="preview-prompt"><audio src="prompt.mp3"></audio></div></div>';

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  async function mount(modelFlags: Record<string, boolean>, html = PROMPT_AUDIO, session = {}) {
    const element = document.createElement(TAG) as any;
    document.body.appendChild(element);
    element.model = {
      choiceMode: 'radio',
      prompt: 'p',
      language: 'en-US',
      choices: [{ value: 'a', label: 'A' }],
      ...modelFlags,
    };
    element.session = { value: ['a'], ...session };
    vi.advanceTimersByTime(100);
    element.innerHTML = html;
    await Promise.resolve();
    const events: CustomEvent[] = [];
    element.addEventListener('session-changed', (event: Event) => {
      events.push(event as CustomEvent);
    });
    const done = () => isComplete(element.session, element._model, element.promptAudio, element);
    return { element, events, done, audio: element.querySelector('audio') as HTMLAudioElement };
  }

  it('offers to enable blocked autoplay when autoplay is on', async () => {
    const { element } = await mount({ autoplayAudioEnabled: true });

    vi.advanceTimersByTime(600);

    expect(element.querySelector('.play-audio-info')).not.toBeNull();
  });

  it('treats a hold as autoplay off', async () => {
    const { element } = await mount({ autoplayAudioEnabled: true, autoplayAudioHeld: true });

    vi.advanceTimersByTime(600);

    expect(element.querySelector('.play-audio-info')).toBeNull();
  });

  it('stops waiting on audio that fails to load', async () => {
    const { events, done, audio } = await mount({ completeAudioEnabled: true });

    expect(done()).toBe(false);

    audio.dispatchEvent(new Event('error'));
    vi.advanceTimersByTime(10);

    expect(done()).toBe(true);
    expect(events.at(-1)?.detail.complete).toBe(true);
  });

  it('does not wait on audio the item declares but does not supply', async () => {
    const { done } = await mount(
      { completeAudioEnabled: true },
      '<div class="main-container"><div class="preview-prompt"><audio><source src=""></audio></div></div>',
    );

    expect(done()).toBe(true);
  });

  it('does not wait on audio a resumed session already played', async () => {
    const { done } = await mount({ completeAudioEnabled: true }, PROMPT_AUDIO, { audioEndTime: 1 });

    expect(done()).toBe(true);
  });
});
