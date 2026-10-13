import { afterEach, describe, expect, it, vi } from 'vitest';

// A part as the eliminator sees it: one target per choice in its model, by value.
vi.mock('@pie-element/multiple-choice', () => ({
  default: class extends HTMLElement {
    static pieSupports = Object.freeze(['answer-masking']);
    eliminated: Array<[string, boolean]> = [];
    choices: Array<{ value: string }> = [];
    set model(model: { choices: Array<{ value: string }> }) {
      this.choices = model.choices;
    }
    set session(_session: unknown) {}
    pieSupportTargets(term: string) {
      if (term !== 'answer-masking') return [];
      return this.choices.map(({ value }) => ({
        id: value,
        label: value,
        container: this,
        content: this,
        isSelected: () => false,
        isEliminable: () => true,
        setEliminated: (eliminated: boolean) => this.eliminated.push([value, eliminated]),
      }));
    }
  },
}));

const { default: Ebsr } = await import('../src/delivery/index.js');
const { EBSR_MULTIPLE_CHOICE_TAG } = await import('../src/private-tags.js');

const TAG = 'pie-ebsr-answer-masking-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, Ebsr as CustomElementConstructor);
}

async function mount() {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  // Both parts use the same choice values, as authored items usually do.
  element.model = {
    mode: 'gather',
    partA: { choiceMode: 'radio', choices: [{ value: 'a' }, { value: 'b' }] },
    partB: { choiceMode: 'radio', choices: [{ value: 'a' }] },
  };
  element.session = { id: '1', element: 'ebsr' };
  await customElements.whenDefined(EBSR_MULTIPLE_CHOICE_TAG);
  await Promise.resolve();
  return element;
}

describe('ebsr answer masking', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('declares answer masking on its class', () => {
    expect(Ebsr.pieSupports).toEqual(['answer-masking']);
  });

  it("supplies both parts' choices with ids prefixed by the part", async () => {
    const element = await mount();

    const targets = element.pieSupportTargets('answer-masking');

    expect(targets.map(({ id }) => id)).toEqual(['a-a', 'a-b', 'b-a']);
    expect(element.pieSupportTargets('text-to-speech')).toEqual([]);
  });

  it('eliminates in the part that renders the choice', async () => {
    const element = await mount();

    element
      .pieSupportTargets('answer-masking')
      .find(({ id }) => id === 'b-a')
      .setEliminated(true);

    expect(element.partA.eliminated).toEqual([]);
    expect(element.partB.eliminated).toEqual([['a', true]]);
  });
});
