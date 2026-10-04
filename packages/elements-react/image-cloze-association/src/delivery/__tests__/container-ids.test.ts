import { afterEach, describe, expect, it, vi } from 'vitest';

import ImageClozeAssociation from '../index';
import { model as buildModel } from '../../controller/index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-ica-container-ids', ImageClozeAssociation as unknown as CustomElementConstructor);

const question = (extra: object = {}) => ({
  prompt: '<p>Place the sun.</p>',
  image: { src: 'sky.png', width: 400, height: 200 },
  possible_responses: ['<p>Sun</p>', '<p>Moon</p>'],
  response_containers: [
    { x: 0, y: 0, width: '20%', height: '20%' },
    { x: 50, y: 0, width: '20%', height: '20%' },
  ],
  validation: {
    scoring_type: 'exactMatch',
    valid_response: { score: 1, value: [{ images: ['<p>Sun</p>'] }, { images: ['<p>Moon</p>'] }] },
  },
  ...extra,
});

const viewModel = async (extra: object = {}) =>
  (await buildModel(question(extra), { answers: [] }, { mode: 'gather' })) as object;

const mount = async (extra: object = {}) => {
  const el = document.createElement('test-ica-container-ids') as Host;
  document.body.appendChild(el);
  el.model = await viewModel(extra);
  el.session = { answers: [] };
  await vi.waitFor(() => expect(el.querySelector('.main-container')).not.toBeNull());
  return el;
};

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((node) => node.id);

const REFERENCE_ATTRIBUTES = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'for'];

const references = (root: ParentNode) =>
  [...root.querySelectorAll('*')].flatMap((node) =>
    REFERENCE_ATTRIBUTES.flatMap((name) => (node.getAttribute(name) || '').split(/\s+/).filter(Boolean)),
  );

const byId = (root: ParentNode, id: string) => root.querySelector(`[id="${id}"]`);

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('image-cloze-association container ids', () => {
  it('repeat no id when two items share a page', async () => {
    await mount();
    await mount();

    expect(ids(document).length).toBeGreaterThan(0);
    expect(new Set(ids(document)).size).toBe(ids(document).length);
  });

  it('keep the main-container class on a container whose id is its own', async () => {
    const first = await mount();
    const second = await mount();

    const containers = [first, second].map((el) => el.querySelector('.main-container') as HTMLElement);
    expect(containers[0].id).toMatch(/^main-container-/);
    expect(containers[1].id).toMatch(/^main-container-/);
    expect(containers[0].id).not.toBe(containers[1].id);
  });

  it('resolve every reference inside its own item', async () => {
    for (const el of [await mount(), await mount()]) {
      expect(references(el).length).toBeGreaterThan(0);
      for (const id of references(el)) {
        expect(byId(el, id)).not.toBeNull();
      }
    }
  });

  it('keep their ids when the item renders again', async () => {
    const el = await mount();
    const before = ids(el);

    el.model = await viewModel({ prompt: '<p>Place them now.</p>' });
    await vi.waitFor(() => expect(el.textContent).toContain('Place them now.'));

    expect(ids(el)).toEqual(before);
  });
});

describe('image-cloze-association prompt audio', () => {
  const AUDIO_PROMPT = { autoplayAudioEnabled: true, prompt: '<p>Listen</p><audio src="prompt.mp3"></audio>' };

  it('shows and clears each item its own enable-audio toast, and plays its own audio', async () => {
    // Autoplay is blocked: play() leaves the audio paused, so each item offers its toast.
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const items = [await mount(AUDIO_PROMPT), await mount(AUDIO_PROMPT)];

    await vi.waitFor(() => {
      for (const el of items) expect(el.querySelector('.play-audio-info')).not.toBeNull();
    });

    const toasts = items.map((el) => el.querySelector('.play-audio-info') as HTMLElement);
    for (const [i, el] of items.entries()) {
      expect(toasts[i].parentElement).toBe(el.querySelector('.main-container'));
      expect(toasts[i].id).toMatch(/^play-audio-info-/);
      expect(el.querySelectorAll('.play-audio-info')).toHaveLength(1);
    }
    expect(toasts[0].id).not.toBe(toasts[1].id);

    play.mockClear();
    document.body.click();

    for (const el of items) {
      expect(play.mock.contexts).toContain(el.querySelector('audio'));
      expect(el.querySelector('.play-audio-info')).toBeNull();
    }
  });
});
