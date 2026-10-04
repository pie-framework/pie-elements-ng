import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Matrix from '../Matrix';
import MatrixElement from '../index';

// The prompt renders math through MathJax, which happy-dom cannot load.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
// Two element versions on a page each bundle their own lodash, whose uniqueId counters both
// start at 1; a constant reproduces that within this one module graph.
vi.mock('@pie-element/shared-lodash', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@pie-element/shared-lodash')>()),
  uniqueId: (prefix = '') => `${prefix}1`,
}));

const matrix = (value: Record<string, number> = { '1-0': 0 }) => (
  <Matrix
    columnLabels={['Disagree', 'Agree']}
    disabled={false}
    matrixValues={{ '0-0': 0, '0-1': 1, '1-0': 0, '1-1': 1 }}
    onSessionChange={vi.fn()}
    rowLabels={['Politics', 'Economics']}
    session={{ value }}
  />
);

const renderMatrix = () => render(matrix());

const pageIds = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

describe('Matrix radio names', () => {
  it('names each radio from its row and column labels', () => {
    renderMatrix();

    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByRole('radio', { name: 'Politics Disagree' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Politics Agree' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Economics Disagree' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Economics Agree' })).not.toBeChecked();
  });

  it('keeps ids distinct across matrices on one page', () => {
    renderMatrix();
    renderMatrix();

    expect(screen.getAllByRole('radio', { name: 'Politics Agree' })).toHaveLength(2);
    expect(new Set(pageIds()).size).toBe(pageIds().length);
  });

  it('keeps its ids across re-renders', () => {
    const { rerender } = render(matrix());
    const before = pageIds();

    rerender(matrix({ '0-1': 1 }));

    expect(screen.getByRole('radio', { name: 'Politics Agree' })).toBeChecked();
    expect(pageIds()).toEqual(before);
  });
});

customElements.define('matrix-radio-group-test', MatrixElement);

type Session = { value?: Record<string, number> };

const mountElement = async (session: Session = {}) => {
  const el = document.createElement('matrix-radio-group-test') as MatrixElement;
  const changes = vi.fn();
  el.addEventListener('session-changed', changes);
  await act(async () => {
    document.body.append(el);
    el.model = {
      columnLabels: ['Disagree', 'Unsure', 'Agree'],
      disabled: false,
      matrixValues: { '0-0': 0, '0-1': 1, '0-2': 2, '1-0': 0, '1-1': 1, '1-2': 2 },
      rowLabels: ['Politics', 'Economics'],
    };
    el.session = session;
  });
  const row = (name: string) => within(el).getByRole('radiogroup', { name });
  return { el, changes, politics: row('Politics'), economics: row('Economics') };
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

describe('Matrix row radio groups', () => {
  it('are named by their row labels and hold one shared name each', async () => {
    const { politics, economics } = await mountElement();

    expect(within(politics).getAllByRole('radio')).toHaveLength(3);
    expect(within(economics).getAllByRole('radio')).toHaveLength(3);
    expect(groupNames(politics).size).toBe(1);
    expect([...groupNames(politics)]).not.toEqual([...groupNames(economics)]);
  });

  it.each([
    ['no choice', {}, ['Politics Disagree', 'Economics Disagree']],
    ['a choice', { value: { '0-1': 1, '1-2': 2 } }, ['Politics Unsure', 'Economics Agree']],
  ])('make each row one tab stop with %s selected', async (_, session, focused) => {
    const user = userEvent.setup();
    const { el } = await mountElement(session);
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
    const { el, changes, politics } = await mountElement({ value: { '1-2': 2 } });

    await user.click(within(politics).getByRole('radio', { name: 'Politics Disagree' }));
    expect(el.session.value).toEqual({ '0-0': 0, '1-2': 2 });

    const steps: [string, string, Record<string, number>][] = [
      ['{ArrowDown}', 'Politics Unsure', { '0-1': 1, '1-2': 2 }],
      ['{ArrowRight}', 'Politics Agree', { '0-2': 2, '1-2': 2 }],
      ['{ArrowRight}', 'Politics Disagree', { '0-0': 0, '1-2': 2 }],
      ['{ArrowUp}', 'Politics Agree', { '0-2': 2, '1-2': 2 }],
      ['{ArrowLeft}', 'Politics Unsure', { '0-1': 1, '1-2': 2 }],
    ];
    for (const [key, name, value] of steps) {
      await user.keyboard(key);
      expect(within(politics).getByRole('radio', { name })).toHaveFocus();
      expect(within(politics).getByRole('radio', { name })).toBeChecked();
      expect(el.session.value).toEqual(value);
    }
    expect(within(el).getByRole('radio', { name: 'Economics Agree' })).toBeChecked();
    expect(changes).toHaveBeenCalledTimes(1 + steps.length);
  });

  it('record the same response for an arrow press as for a click', async () => {
    const user = userEvent.setup();
    const byKeyboard = await mountElement();
    const byClick = await mountElement();

    await user.click(within(byKeyboard.politics).getByRole('radio', { name: 'Politics Disagree' }));
    await user.keyboard('{ArrowRight}');
    await user.click(within(byClick.politics).getByRole('radio', { name: 'Politics Unsure' }));

    expect(byKeyboard.el.session.value).toEqual({ '0-1': 1 });
    expect(byKeyboard.el.session.value).toEqual(byClick.el.session.value);
  });

  it('leave a second matrix unchanged', async () => {
    const user = userEvent.setup();
    const first = await mountElement({ value: { '1-0': 0 } });
    const second = await mountElement({ value: { '1-0': 0 } });

    expect([...groupNames(first.economics)]).not.toEqual([...groupNames(second.economics)]);

    await user.click(within(first.economics).getByRole('radio', { name: 'Economics Unsure' }));
    await user.keyboard('{ArrowRight}');

    expect(first.el.session.value).toEqual({ '1-2': 2 });
    expect(second.el.session.value).toEqual({ '1-0': 0 });
    expect(within(second.economics).getByRole('radio', { name: 'Economics Disagree' })).toBeChecked();
    expect(second.changes).not.toHaveBeenCalled();
  });
});
