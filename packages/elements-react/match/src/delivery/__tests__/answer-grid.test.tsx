import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AnswerGrid from '../answer-grid';

// Two element versions on a page each bundle their own lodash, whose uniqueId counters both
// start at 1; a constant reproduces that within this one module graph.
vi.mock('@pie-element/shared-lodash', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@pie-element/shared-lodash')>()),
  uniqueId: (prefix = '') => `${prefix}1`,
}));

const theme = createTheme();

const rows = [
  { id: 1, title: '<p>The sky is blue</p>' },
  { id: 2, title: 'Fish can fly' },
];

const grid = (choiceMode: 'radio' | 'checkbox', answers = { 1: [true, false], 2: [false, false] }) => (
  <ThemeProvider theme={theme}>
    <AnswerGrid
      answers={answers}
      choiceMode={choiceMode}
      correctAnswers={{ 1: [true, false], 2: [false, true] }}
      disabled={false}
      headers={['Statement', 'True', '<strong>False</strong>']}
      onAnswerChange={vi.fn()}
      rows={rows}
      showCorrect={false}
      view={false}
    />
  </ThemeProvider>
);

const renderGrid = (choiceMode: 'radio' | 'checkbox') => render(grid(choiceMode));

const pageIds = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

describe('AnswerGrid accessible names', () => {
  it.each([
    ['radio', 'radio'],
    ['checkbox', 'checkbox'],
  ] as const)('names each %s from its row title and column header', (choiceMode, role) => {
    renderGrid(choiceMode);

    expect(screen.getAllByRole(role)).toHaveLength(4);
    expect(screen.getByRole(role, { name: 'The sky is blue True' })).toBeChecked();
    expect(screen.getByRole(role, { name: 'The sky is blue False' })).not.toBeChecked();
    expect(screen.getByRole(role, { name: 'Fish can fly True' })).not.toBeChecked();
    expect(screen.getByRole(role, { name: 'Fish can fly False' })).not.toBeChecked();
  });

  it.each([
    ['radio', 'radiogroup'],
    ['checkbox', 'group'],
  ] as const)('names each %s row group from its row title', (choiceMode, groupRole) => {
    renderGrid(choiceMode);

    const group = screen.getByRole(groupRole, { name: 'Fish can fly' });
    expect(within(group).getAllByRole(choiceMode)).toHaveLength(2);
    expect(screen.getByRole(groupRole, { name: 'The sky is blue' })).toBeInTheDocument();
  });

  it('gives the radios of each row one name of their own, and checkboxes none', () => {
    renderGrid('radio');
    const names = (row: string) =>
      new Set(within(screen.getByRole('radiogroup', { name: row })).getAllByRole('radio').map((r) => r.getAttribute('name')));

    expect(names('The sky is blue').size).toBe(1);
    expect(names('Fish can fly').size).toBe(1);
    expect([...names('The sky is blue')]).not.toEqual([...names('Fish can fly')]);

    renderGrid('checkbox');
    expect(screen.getAllByRole('checkbox').map((box) => box.getAttribute('name'))).toEqual([null, null, null, null]);
  });

  it('marks the header cells as column headers', () => {
    renderGrid('radio');

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Statement',
      'True',
      'False',
    ]);
  });
});

describe('AnswerGrid ids', () => {
  it('stay unique when two items share a page', () => {
    renderGrid('radio');
    renderGrid('radio');

    expect(screen.getAllByRole('radio', { name: 'Fish can fly False' })).toHaveLength(2);
    expect(new Set(pageIds()).size).toBe(pageIds().length);
  });

  it('stay the same across re-renders', () => {
    const { rerender } = render(grid('radio'));
    const before = pageIds();

    rerender(grid('radio', { 1: [true, false], 2: [false, true] }));

    expect(screen.getByRole('radio', { name: 'Fish can fly False' })).toBeChecked();
    expect(pageIds()).toEqual(before);
  });
});
