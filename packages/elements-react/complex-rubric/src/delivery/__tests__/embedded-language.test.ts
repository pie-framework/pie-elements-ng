import { afterEach, describe, expect, it, vi } from 'vitest';

import ComplexRubric from '../index';

vi.mock('@pie-element/rubric', () => ({ default: class extends HTMLElement {} }));
vi.mock('@pie-element/multi-trait-rubric', () => ({ default: class extends HTMLElement {} }));

type RubricHost = HTMLElement & {
  model: object;
  simpleRubric: (HTMLElement & { model?: { language?: string } }) | null;
  rubricless: (HTMLElement & { model?: { language?: string } }) | null;
  multiTraitRubric: (HTMLElement & { model?: { language?: string } }) | null;
};

customElements.define('test-complex-rubric-language', ComplexRubric as unknown as CustomElementConstructor);

const settle = () => new Promise((resolve) => setTimeout(resolve));

afterEach(() => {
  document.body.innerHTML = '';
});

describe.each(['simpleRubric', 'rubricless', 'multiTraitRubric'] as const)('%s', (rubricType) => {
  const render = async (rubric: object) => {
    const el = document.createElement('test-complex-rubric-language') as RubricHost;
    document.body.appendChild(el);
    el.model = { rubricType, language: 'es', mode: 'gather', rubrics: { [rubricType]: rubric } };
    await settle();
    return el[rubricType]?.model;
  };

  it("takes the item's declared language", async () => {
    expect(await render({})).toMatchObject({ language: 'es', mode: 'gather' });
  });

  it('keeps a language the embedded rubric declares', async () => {
    expect(await render({ language: 'fr' })).toMatchObject({ language: 'fr' });
  });
});
