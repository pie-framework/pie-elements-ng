import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModelUpdatedEvent } from '@pie-element/shared-configure-events';

import ComplexRubricConfigureElement from '../index';

// The rubric configure elements, reduced to what complex-rubric reads from them: the event they
// dispatch.
vi.mock('@pie-element/rubric/author', () => ({ default: class extends HTMLElement {} }));
vi.mock('@pie-element/multi-trait-rubric/author', () => ({ default: class extends HTMLElement {} }));

type ConfigureHost = HTMLElement & { model: object };

customElements.define('test-complex-rubric-configure', ComplexRubricConfigureElement as unknown as CustomElementConstructor);

const configure = async () => {
  const el = document.createElement('test-complex-rubric-configure') as ConfigureHost;
  document.body.appendChild(el);
  el.model = { rubricType: 'simpleRubric' };
  await vi.waitFor(() => expect(el.querySelector('[data-rubric-type]')).not.toBeNull());
  return el;
};

const ids = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('complex-rubric configure', () => {
  it('repeats no id when two items share a page', async () => {
    await configure();
    await configure();

    expect(new Set(ids()).size).toBe(ids().length);
  });

  it('stores an edit under the rubric type of the rubric that made it', async () => {
    await configure();
    const el = await configure();
    const updated = vi.fn();
    el.addEventListener(ModelUpdatedEvent.TYPE, updated);

    el.querySelector('[data-rubric-type="simpleRubric"]')?.dispatchEvent(new ModelUpdatedEvent({ points: ['edited'] }));

    expect(updated).toHaveBeenCalledTimes(1);
    expect(updated.mock.calls[0][0].update.rubrics.simpleRubric).toEqual({ points: ['edited'] });
  });
});
