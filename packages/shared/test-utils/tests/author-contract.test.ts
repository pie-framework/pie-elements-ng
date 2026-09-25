import { describe, expect, it } from 'vitest';
import { assertAuthorElementProperties, assertAuthorModelUpdate } from '../src/author-contract';

// The shape of `ModelUpdatedEvent` from `@pie-element/shared-configure-events`.
class ModelUpdated extends CustomEvent<{ update: unknown; reset: boolean }> {
  constructor(
    readonly update: unknown,
    readonly reset = false
  ) {
    super('model.updated', { bubbles: true, detail: { update, reset } });
  }
}

type Emit = (el: FakeAuthor, next: Record<string, unknown>) => void;

class FakeAuthor extends HTMLElement {
  static emit: Emit = (el, next) => {
    el._model = next;
    el.dispatchEvent(new ModelUpdated(next));
  };
  _model: Record<string, unknown> = {};
  configurationSet: unknown;
  get model() {
    return this._model;
  }
  set model(m: Record<string, unknown>) {
    this._model = m;
  }
  set configuration(c: unknown) {
    this.configurationSet = c;
  }
  connectedCallback() {
    this.innerHTML = '<button>edit</button>';
    this.querySelector('button')?.addEventListener('click', () =>
      (this.constructor as typeof FakeAuthor).emit(this, { ...this._model, prompt: 'edited' })
    );
  }
}

let count = 0;
function register(emit?: Emit): string {
  const tag = `fake-author-${++count}-config`;
  const ctor = class extends FakeAuthor {};
  if (emit) ctor.emit = emit;
  customElements.define(tag, ctor);
  return tag;
}

const MODEL = { id: '1', element: 'fake-author--version-1-0-0', prompt: 'p' };
const clickEdit = (el: HTMLElement) => el.querySelector('button')?.click();

describe('assertAuthorElementProperties', () => {
  it('passes an element that declares model and configuration', () => {
    expect(() => assertAuthorElementProperties(register())).not.toThrow();
  });

  it('names a property the element does not declare', () => {
    class NoConfiguration extends HTMLElement {
      set model(_m: unknown) {}
    }
    const tag = `fake-author-${++count}-config`;
    customElements.define(tag, NoConfiguration);

    expect(() => assertAuthorElementProperties(tag)).toThrow(/no `configuration` property/);
  });
});

/** Keeps edits apart from the host's property and remounts from it, as a Svelte element assigning a local prop does. */
class RemountingAuthor extends FakeAuthor {
  hostModel: Record<string, unknown> = {};
  override set model(m: Record<string, unknown>) {
    this.hostModel = m;
    this._model = m;
  }
  override get model() {
    return this._model;
  }
  override connectedCallback() {
    this._model = this.hostModel;
    super.connectedCallback();
  }
}

describe('assertAuthorModelUpdate', () => {
  it('returns the edit for an element that meets the contract', async () => {
    const { event, element, cleanup } = await assertAuthorModelUpdate({
      tag: register(),
      model: MODEL,
      configuration: { prompt: { label: 'Question' } },
      edit: clickEdit,
    });

    expect(event.detail).toEqual({ update: { ...MODEL, prompt: 'edited' }, reset: false });
    expect((element as FakeAuthor).configurationSet).toEqual({ prompt: { label: 'Question' } });
    cleanup();
  });

  it.each<[string, Emit, RegExp]>([
    [
      'a plain CustomEvent',
      (el, next) => {
        el._model = next;
        el.dispatchEvent(
          new CustomEvent('model.updated', {
            bubbles: true,
            detail: { update: next, reset: false },
          })
        );
      },
      /plain CustomEvent/,
    ],
    [
      'an event that does not bubble',
      (el, next) => {
        el._model = next;
        el.dispatchEvent(
          new CustomEvent('model.updated', { detail: { update: next, reset: false } })
        );
      },
      /does not bubble/,
    ],
    [
      'an event from an inner node',
      (el, next) => {
        el._model = next;
        el.querySelector('button')?.dispatchEvent(new ModelUpdated(next));
      },
      /inner node/,
    ],
    [
      'an update without id and element',
      (el, next) => {
        const { id: _id, element: _element, ...rest } = next;
        el._model = next;
        el.dispatchEvent(new ModelUpdated(rest));
      },
      /lacks the model's `id` and `element`/,
    ],
    [
      'a model set after the event',
      (el, next) => {
        el.dispatchEvent(new ModelUpdated(next));
        el._model = next;
      },
      /does not hold the edit/,
    ],
    [
      'two events for one edit',
      (el, next) => {
        el._model = next;
        el.dispatchEvent(new ModelUpdated(next));
        el.dispatchEvent(new ModelUpdated(next));
      },
      /as 2 `model.updated` events/,
    ],
    [
      'an update that leaves out a field the edit did not touch',
      (el) => {
        const { prompt: _prompt, ...rest } = MODEL;
        el._model = { ...rest, title: 'edited' };
        el.dispatchEvent(new ModelUpdated(el._model));
      },
      /leaves out `prompt`/,
    ],
    ['no event', () => {}, /as 0 `model.updated` events/],
  ])('rejects %s', async (_name, emit, message) => {
    await expect(
      assertAuthorModelUpdate({ tag: register(emit), model: MODEL, edit: clickEdit })
    ).rejects.toThrow(message);
    expect(document.body.children).toHaveLength(0);
  });

  it('rejects an element whose model reverts when it is re-attached', async () => {
    const tag = `fake-author-${++count}-config`;
    customElements.define(tag, class extends RemountingAuthor {});

    await expect(assertAuthorModelUpdate({ tag, model: MODEL, edit: clickEdit })).rejects.toThrow(
      /loses the edit when the element is detached and re-attached/
    );
  });
});
