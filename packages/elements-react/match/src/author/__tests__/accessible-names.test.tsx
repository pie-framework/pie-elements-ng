import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Configure from '../configure.js';
import defaults from '../defaults.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

describe('match authoring field names', () => {
  it.each(['radio', 'checkbox'] as const)('distinguishes rows, columns, and correct answers in %s mode', async (choiceMode) => {
    const model = { ...defaults.model, choiceMode, rows: [
      { id: 'first', title: 'First row', values: [true, false] },
      { id: 'second', title: 'Second row', values: [false, true] },
    ] };
    render(<Configure model={model} configuration={{ ...defaults.configuration, settingsPanelDisabled: true }}
      onModelChanged={vi.fn()} onConfigurationChanged={vi.fn()} />);
    for (const label of ['Teacher Instructions', 'Prompt', 'Rationale']) {
      expect(await screen.findByRole('textbox', { name: label })).toBeInTheDocument();
    }
    for (const number of [1, 2, 3]) {
      expect(screen.getByRole('textbox', { name: `Column ${number} label` })).toBeInTheDocument();
    }
    expect(screen.getByRole('spinbutton', { name: 'Layout' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Response Type' })).toBeInTheDocument();
    for (const row of [1, 2]) {
      expect(screen.getByRole('textbox', { name: `Row ${row} label` })).toBeInTheDocument();
      for (const column of [2, 3]) {
        expect(screen.getByRole(choiceMode, { name: `Correct answer for row ${row}, column ${column}` })).toBeInTheDocument();
      }
    }
  });
});
