import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/categorize/index.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/render-ui', () => ({
  default: { EnableAudioAutoplayImage: () => null },
  EnableAudioAutoplayImage: () => null,
  createUniqueId: (prefix: string) => `${prefix}-test`,
}));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { model } = await import('../src/controller/index.js');
const { default: Categorize } = await import('../src/delivery/index.js');

const TAG = 'pie-categorize-complete-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, Categorize as CustomElementConstructor);
}

const categories = [{ id: 'c1', label: 'Fruit' }, { id: 'c2', label: 'Vegetable' }];
const choices = [{ id: 'ch1', content: 'Apple' }, { id: 'ch2', content: 'Carrot' }, { id: 'ch3', content: 'Stone' }];

/** Whether the element reports `answers` complete, given the gather-mode model a student receives. */
async function complete(question: object, answers: { category: string; choices: string[] }[]) {
  const session = { id: '1', answers };
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.session = session;
  element.model = await model(
    { categories, lockChoiceOrder: true, allowMultiplePlacementsEnabled: 'No', ...question } as any,
    session as any,
    { mode: 'gather', role: 'student' },
  );
  return element.isComplete();
}

describe('categorize completeness from a gather-mode model', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  // Every choice belongs somewhere, so complete means every choice is placed.
  const placesEveryChoice = {
    choices,
    correctResponse: [{ category: 'c1', choices: ['ch1', 'ch3'] }, { category: 'c2', choices: ['ch2'] }],
  };

  it('is complete once every choice is placed', async () => {
    const answers = [{ category: 'c1', choices: ['ch1'] }, { category: 'c2', choices: ['ch2', 'ch3'] }];
    expect(await complete(placesEveryChoice, answers)).toBe(true);
  });

  it('is incomplete while a choice is unplaced', async () => {
    const answers = [{ category: 'c1', choices: ['ch1'] }, { category: 'c2', choices: ['ch2'] }];
    expect(await complete(placesEveryChoice, answers)).toBe(false);
  });

  // `ch3` is a distractor, so complete means as many categories filled as the correct answer fills.
  const withDistractor = {
    choices,
    correctResponse: [{ category: 'c1', choices: ['ch1'] }, { category: 'c2', choices: ['ch2'] }],
  };

  it('with a distractor, is complete once enough categories are filled', async () => {
    const answers = [{ category: 'c1', choices: ['ch3'] }, { category: 'c2', choices: ['ch1'] }];
    expect(await complete(withDistractor, answers)).toBe(true);
  });

  it('with a distractor, is incomplete while a category the answer fills is empty', async () => {
    const answers = [{ category: 'c1', choices: ['ch1', 'ch2'] }, { category: 'c2', choices: [] }];
    expect(await complete(withDistractor, answers)).toBe(false);
  });
});
