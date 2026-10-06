import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModelUpdatedEvent } from '@pie-element/shared-configure-events';

import EbsrConfigure from '../index';

// The multiple-choice configure element, reduced to what ebsr reads from it: the event it
// dispatches.
vi.mock('@pie-element/multiple-choice/author', () => ({ default: class extends HTMLElement {} }));

type ConfigureHost = HTMLElement & { model: object };

customElements.define('test-ebsr-configure-part-ids', EbsrConfigure as unknown as CustomElementConstructor);

const configure = async () => {
  const el = document.createElement('test-ebsr-configure-part-ids') as ConfigureHost;
  document.body.appendChild(el);
  el.model = {};
  await vi.waitFor(() => {
    expect(el.querySelector('[data-part="A"]')).not.toBeNull();
    expect(el.querySelector('[data-part="B"]')).not.toBeNull();
  });
  return el;
};

const ids = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ebsr configure parts', () => {
  it('repeat no id when two items share a page', async () => {
    await configure();
    await configure();

    expect(new Set(ids()).size).toBe(ids().length);
  });

  it.each(['A', 'B'])('store an edit under the part that made it (%s)', async (part) => {
    await configure();
    const el = await configure();
    const updated = vi.fn();
    el.addEventListener(ModelUpdatedEvent.TYPE, updated);

    el.querySelector(`[data-part="${part}"]`)?.dispatchEvent(new ModelUpdatedEvent({ prompt: 'edited' }));

    expect(updated).toHaveBeenCalledTimes(1);
    expect(updated.mock.calls[0][0].update[`part${part}`]).toEqual({ prompt: 'edited' });
  });
});
