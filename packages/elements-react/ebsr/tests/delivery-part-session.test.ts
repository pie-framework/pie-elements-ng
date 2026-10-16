import { afterEach, describe, expect, it, vi } from 'vitest';

// The multiple-choice delivery element as a part sees it: it keeps the session object it is
// given and writes an answer into it before reporting session-changed on a later tick.
vi.mock('@pie-element/multiple-choice', () => ({
  default: class extends HTMLElement {
    _session: any;
    _model: any;
    set model(model: unknown) {
      this._model = model;
    }
    set session(session: any) {
      this._session = session;
    }
    get session() {
      return this._session;
    }
    answer(value: string) {
      this._session.value = [value];
      setTimeout(() =>
        this.dispatchEvent(
          new CustomEvent('session-changed', {
            bubbles: true,
            composed: true,
            detail: { complete: true, component: this.tagName.toLowerCase() },
          })
        )
      );
    }
  },
}));

// The element reads the part through `srcElement`, which browsers alias to `target` and
// happy-dom leaves out.
if (!('srcElement' in Event.prototype)) {
  Object.defineProperty(Event.prototype, 'srcElement', {
    get() {
      return this.target;
    },
  });
}

const { default: Ebsr } = await import('../src/delivery/index.js');
const { EBSR_MULTIPLE_CHOICE_TAG } = await import('../src/private-tags.js');

const TAG = 'pie-ebsr-part-session-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, Ebsr as CustomElementConstructor);
}

async function mount(modelFlags: Record<string, unknown> = {}) {
  const element = document.createElement(TAG) as any;
  const forwarded: unknown[] = [];
  // A host that listens on the element before connecting it runs ahead of the element's own
  // listener, so it sees each part's event first.
  element.addEventListener('session-changed', () => {
    forwarded.push(structuredClone(element.session));
  });
  document.body.appendChild(element);
  element.model = {
    mode: 'gather',
    partA: { choiceMode: 'radio', choices: [{ value: 'a', label: 'A' }] },
    partB: { choiceMode: 'radio', choices: [{ value: 'b', label: 'B' }] },
    ...modelFlags,
  };
  element.session = { id: '1', element: 'ebsr' };
  await customElements.whenDefined(EBSR_MULTIPLE_CHOICE_TAG);
  await Promise.resolve();
  return { element, forwarded };
}

describe('ebsr part sessions', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('holds a part answer from the moment the part records it', async () => {
    const { element } = await mount();

    element.querySelector(`${EBSR_MULTIPLE_CHOICE_TAG}[data-part="a"]`).answer('a');

    expect(element.session.value.partA.value).toEqual(['a']);
  });

  it('shows the answer to a host that hears the part event first', async () => {
    vi.useFakeTimers();
    const { element, forwarded } = await mount();

    element.querySelector(`${EBSR_MULTIPLE_CHOICE_TAG}[data-part="a"]`).answer('a');
    vi.advanceTimersByTime(10);

    expect(forwarded[0]).toMatchObject({ value: { partA: { value: ['a'] } } });
  });
});

describe('ebsr autoplay hold', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('holds both parts when the item is held', async () => {
    const { element } = await mount({ autoplayAudioHeld: true });

    for (const key of ['a', 'b']) {
      expect(element.querySelector(`${EBSR_MULTIPLE_CHOICE_TAG}[data-part="${key}"]`)._model).toMatchObject({
        autoplayAudioHeld: true,
      });
    }
  });

  it('leaves the parts unheld otherwise', async () => {
    const { element } = await mount();

    expect(
      element.querySelector(`${EBSR_MULTIPLE_CHOICE_TAG}[data-part="a"]`)._model.autoplayAudioHeld,
    ).toBeUndefined();
  });
});
