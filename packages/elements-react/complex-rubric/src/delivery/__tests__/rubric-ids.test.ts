import { afterEach, describe, expect, it, vi } from 'vitest';

import ComplexRubric from '../index';
import ComplexRubricPrint from '../../print/index';

// The rubric elements themselves, reduced to what complex-rubric hands them: a model.
vi.mock('@pie-element/rubric', () => ({ default: class extends HTMLElement {} }));
vi.mock('@pie-element/multi-trait-rubric', () => ({ default: class extends HTMLElement {} }));

type RubricHost = HTMLElement & {
  model: object;
  options: object;
  simpleRubric: (HTMLElement & { model?: object }) | null;
  rubricless: (HTMLElement & { model?: object }) | null;
  multiTraitRubric: (HTMLElement & { model?: object }) | null;
};

customElements.define('test-complex-rubric', ComplexRubric as unknown as CustomElementConstructor);
customElements.define('test-complex-rubric-print', ComplexRubricPrint as unknown as CustomElementConstructor);

const rubricTypes = ['simpleRubric', 'rubricless', 'multiTraitRubric'] as const;

const host = (tag: string, rubricType: (typeof rubricTypes)[number], label: string) => {
  const el = document.createElement(tag) as RubricHost;
  document.body.appendChild(el);
  el.options = { role: 'instructor' };
  el.model = { rubricType, rubrics: { [rubricType]: { label } } };
  return el;
};

// The rubric receives its model once its element is defined.
const settle = () => new Promise((resolve) => setTimeout(resolve));

const ids = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

afterEach(() => {
  document.body.innerHTML = '';
});

describe.each(['test-complex-rubric', 'test-complex-rubric-print'])('%s rubric ids', (tag) => {
  it.each(rubricTypes)('repeat no id when two items share a page (%s)', (rubricType) => {
    host(tag, rubricType, 'first');
    host(tag, rubricType, 'second');

    expect(ids()).toHaveLength(2);
    expect(new Set(ids()).size).toBe(2);
  });

  it.each(rubricTypes)('hand each item its own rubric (%s)', async (rubricType) => {
    const first = host(tag, rubricType, 'first');
    const second = host(tag, rubricType, 'second');
    await settle();

    for (const [el, label] of [
      [first, 'first'],
      [second, 'second'],
    ] as const) {
      const rubric = el[rubricType];
      expect(rubric && el.contains(rubric)).toBe(true);
      expect(rubric?.model).toEqual(expect.objectContaining({ label }));
    }
  });

  it('keep their ids when the item renders again', () => {
    const el = host(tag, 'simpleRubric', 'first');
    const before = ids();

    el.model = { rubricType: 'simpleRubric', rubrics: { simpleRubric: { label: 'renamed' } } };
    el.remove();
    document.body.appendChild(el);

    expect(ids()).toEqual(before);
  });
});
