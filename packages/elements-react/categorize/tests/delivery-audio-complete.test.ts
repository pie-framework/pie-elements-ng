import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/categorize/index.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/render-ui', () => ({
  default: { EnableAudioAutoplayImage: () => null },
  EnableAudioAutoplayImage: () => null,
}));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: Categorize } = await import('../src/delivery/index.js');

const TAG = 'pie-categorize-audio-complete-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, Categorize as CustomElementConstructor);
}

const PROMPT_AUDIO = '<div id="main-container"><div class="preview-prompt"><audio></audio></div></div>';

// A model/session pair whose response alone counts as complete.
const answeredModel = { choices: [{ id: 'c1', categoryCount: 0 }], responseAreasToBeFilled: 1 };
const answeredSession = () => ({ answers: [{ category: 'cat1', choices: ['c1'] }] });

function create(modelFlags: Record<string, boolean>) {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.session = answeredSession();
  element.model = { ...answeredModel, ...modelFlags };
  vi.advanceTimersByTime(100);
  return element;
}

describe('categorize audio requirement', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

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
      const element = create({ autoplayAudioEnabled, completeAudioEnabled });
      element.innerHTML = PROMPT_AUDIO;
      element.audioComplete = audioComplete;

      expect(element.isComplete()).toBe(expected);
    },
  );

  it('ignores completeAudioEnabled when the prompt has no audio', () => {
    const element = create({ completeAudioEnabled: true });

    expect(element.isComplete()).toBe(true);
  });
});

describe('categorize prompt audio tracking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  async function mount(modelFlags: Record<string, boolean>) {
    const element = create(modelFlags);

    // The React tree is mocked, so stand in for the markup it renders around the prompt.
    element.innerHTML = PROMPT_AUDIO;
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

    expect(element.isComplete()).toBe(false);

    audio.dispatchEvent(new Event('playing'));
    audio.dispatchEvent(new Event('ended'));
    vi.advanceTimersByTime(100);

    expect(element.audioComplete).toBe(true);
    expect(element.session.audioStartTime).toEqual(expect.any(Number));
    expect(element.session.audioEndTime).toEqual(expect.any(Number));
    expect(events.at(-1)?.detail.complete).toBe(true);
  });

  it('does not show the enable-autoplay overlay with autoplay off', async () => {
    const { element } = await mount({ autoplayAudioEnabled: false, completeAudioEnabled: true });

    vi.advanceTimersByTime(600);

    expect(element.querySelector('#play-audio-info')).toBeNull();
  });

  it('does not track the audio when neither flag is on', async () => {
    const { element, audio } = await mount({
      autoplayAudioEnabled: false,
      completeAudioEnabled: false,
    });

    audio.dispatchEvent(new Event('ended'));

    expect(element.audioComplete).toBeFalsy();
  });
});
