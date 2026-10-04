import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AnswerGrid from '../answer-grid';

const theme = createTheme();

const rows = [
  { id: 1, title: '<p>The sky is blue</p>' },
  { id: 2, title: 'Fish can fly' },
];

const renderGrid = (choiceMode: 'radio' | 'checkbox') =>
  render(
    <ThemeProvider theme={theme}>
      <AnswerGrid
        answers={{ 1: [true, false], 2: [false, false] }}
        choiceMode={choiceMode}
        correctAnswers={{ 1: [true, false], 2: [false, true] }}
        disabled={false}
        headers={['Statement', 'True', '<strong>False</strong>']}
        onAnswerChange={vi.fn()}
        rows={rows}
        showCorrect={false}
        view={false}
      />
    </ThemeProvider>,
  );

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

  it('names each row group from its row title', () => {
    renderGrid('radio');

    const group = screen.getByRole('group', { name: 'Fish can fly' });
    expect(within(group).getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByRole('group', { name: 'The sky is blue' })).toBeInTheDocument();
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
