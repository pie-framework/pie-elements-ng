import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchElement from '../index';

// Row titles render math through MathJax, which happy-dom cannot load.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

customElements.define('match-radio-group-test', MatchElement);

type Answers = Record<number, boolean[]>;

const mountElement = async (answers: Answers = { 1: [false, false], 2: [false, false] }) => {
  const el = document.createElement('match-radio-group-test') as MatchElement & { session: { answers: Answers } };
  const changes = vi.fn();
  el.addEventListener('session-changed', changes);
  await act(async () => {
    document.body.append(el);
    el.model = {
      choiceMode: 'radio',
      disabled: false,
      headers: ['Statement', 'True', 'False'],
      layout: 3,
      rows: [
        { id: 1, title: 'The sky is blue' },
        { id: 2, title: 'Fish can fly' },
      ],
    };
    el.session = { answers };
  });
  changes.mockClear();
  const row = (name: string) => within(el).getByRole('radiogroup', { name });
  return { el, changes, sky: row('The sky is blue'), fish: row('Fish can fly') };
};

const appendButton = () => {
  const button = document.createElement('button');
  button.textContent = 'After';
  document.body.append(button);
  return button;
};

afterEach(async () => {
  await act(async () => document.body.replaceChildren());
});

const groupNames = (group: HTMLElement) =>
  new Set(within(group).getAllByRole('radio').map((radio) => radio.getAttribute('name')));

describe('Match row radio groups', () => {
  it.each([
    ['no choice', { 1: [false, false], 2: [false, false] }, ['The sky is blue True', 'Fish can fly True']],
    ['a choice', { 1: [false, true], 2: [false, true] }, ['The sky is blue False', 'Fish can fly False']],
  ])('make each row one tab stop with %s selected', async (_, answers, focused) => {
    const user = userEvent.setup();
    const { el } = await mountElement(answers);
    const next = appendButton();

    for (const name of focused) {
      await user.tab();
      expect(within(el).getByRole('radio', { name })).toHaveFocus();
    }
    await user.tab();
    expect(next).toHaveFocus();
  });

  it('move the selection within the focused row on arrow keys and record each press', async () => {
    const user = userEvent.setup();
    const { el, changes, sky } = await mountElement({ 1: [false, false], 2: [false, true] });

    await user.click(within(sky).getByRole('radio', { name: 'The sky is blue True' }));
    expect(el.session.answers).toEqual({ 1: [true, false], 2: [false, true] });

    const steps: [string, string, boolean[]][] = [
      ['{ArrowDown}', 'The sky is blue False', [false, true]],
      ['{ArrowRight}', 'The sky is blue True', [true, false]],
      ['{ArrowLeft}', 'The sky is blue False', [false, true]],
      ['{ArrowUp}', 'The sky is blue True', [true, false]],
    ];
    for (const [key, name, row] of steps) {
      await user.keyboard(key);
      expect(within(sky).getByRole('radio', { name })).toHaveFocus();
      expect(within(sky).getByRole('radio', { name })).toBeChecked();
      expect(el.session.answers).toEqual({ 1: row, 2: [false, true] });
    }
    expect(within(el).getByRole('radio', { name: 'Fish can fly False' })).toBeChecked();
    expect(changes).toHaveBeenCalledTimes(1 + steps.length);
  });

  it('record the same response for an arrow press as for a click', async () => {
    const user = userEvent.setup();
    const byKeyboard = await mountElement();
    const byClick = await mountElement();

    await user.click(within(byKeyboard.sky).getByRole('radio', { name: 'The sky is blue True' }));
    await user.keyboard('{ArrowRight}');
    await user.click(within(byClick.sky).getByRole('radio', { name: 'The sky is blue False' }));

    expect(byKeyboard.el.session.answers).toEqual({ 1: [false, true], 2: [false, false] });
    expect(byKeyboard.el.session.answers).toEqual(byClick.el.session.answers);
  });

  it('leave a second match item unchanged', async () => {
    const user = userEvent.setup();
    const first = await mountElement({ 1: [false, false], 2: [true, false] });
    const second = await mountElement({ 1: [false, false], 2: [true, false] });

    expect([...groupNames(first.fish)]).not.toEqual([...groupNames(second.fish)]);

    await user.click(within(first.fish).getByRole('radio', { name: 'Fish can fly True' }));
    await user.keyboard('{ArrowRight}');

    expect(first.el.session.answers).toEqual({ 1: [false, false], 2: [false, true] });
    expect(second.el.session.answers).toEqual({ 1: [false, false], 2: [true, false] });
    expect(within(second.fish).getByRole('radio', { name: 'Fish can fly True' })).toBeChecked();
    expect(second.changes).not.toHaveBeenCalled();
  });
});
