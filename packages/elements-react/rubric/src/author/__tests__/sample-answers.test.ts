import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModelUpdatedEvent } from '@pie-element/shared-configure-events';

// The editor UI, reduced to what this test needs from it: the model it is given, and a way to
// make an edit the way the UI reports one.
const shown: { model?: any; onModelChanged?: (m: any) => void } = {};
vi.mock('../main.js', () => ({
  default: (props: any) => {
    shown.model = props.model;
    shown.onModelChanged = props.onModelChanged;
    return null;
  },
}));

const { default: RubricElement } = await import('../index');
customElements.define('test-rubric-configure', RubricElement as unknown as CustomElementConstructor);

const configure = async (model: object) => {
  const el = document.createElement('test-rubric-configure') as HTMLElement & { model: object };
  document.body.appendChild(el);
  el.model = model;
  await vi.waitFor(() => expect(shown.model).toBeDefined());
  return el;
};

const threeLevels = { points: ['zero', 'one', 'two'], maxPoints: 2, excludeZero: false };

afterEach(() => {
  document.body.innerHTML = '';
  delete shown.model;
});

// DNAATD-5648: a three-level rubric must not be saved with the four-slot default, which the
// player then read one score off.
describe('rubric configure sample answers', () => {
  it('gets one empty slot per score when the model has none', async () => {
    await configure(threeLevels);

    expect(shown.model.sampleAnswers).toEqual([null, null, null]);
  });

  it('drops the empty leading slot of a stored four-slot list', async () => {
    await configure({ ...threeLevels, sampleAnswers: [null, 'S0', 'S1', 'S2'] });

    expect(shown.model.sampleAnswers).toEqual(['S0', 'S1', 'S2']);
  });

  it('keeps samples with their scores when max points goes up', async () => {
    const el = await configure({ ...threeLevels, sampleAnswers: [null, 'S0', 'S1', 'S2'] });
    const updated = vi.fn();
    el.addEventListener(ModelUpdatedEvent.TYPE, updated);

    shown.onModelChanged?.({ ...shown.model, maxPoints: 3 });

    expect(updated.mock.calls[0][0].update.points).toEqual(['zero', 'one', 'two', '']);
    expect(updated.mock.calls[0][0].update.sampleAnswers).toEqual(['S0', 'S1', 'S2', null]);
  });
});
