import React from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Main from '../main.js';
import defaults from '../defaults.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

it('names the template editor and associates formatted choice rationales with their visible labels', async () => {
  const model = { ...defaults.model, slateMarkup: '<p>Complete the sentence.</p>', choices: {
    '0': [{ value: '0', label: '<strong>Alpha</strong>', correct: true, rationale: 'First explanation' }],
    '1': [{ value: '1', label: '<em>Alpha</em>', correct: false, rationale: 'Second explanation' }],
  } };
  render(<Main model={model} configuration={{ ...defaults.configuration, settingsPanelDisabled: true }}
    onModelChanged={vi.fn()} onConfigurationChanged={vi.fn()} />);
  for (const label of ['Teacher Instructions', 'Prompt', 'Response template', 'Rationale']) {
    expect(await screen.findByRole('textbox', { name: label })).toBeInTheDocument();
  }
  for (const number of [1, 2]) {
    fireEvent.click(screen.getByRole('button', { name: `Rationale for response area #${number}` }));
  }
  expect(await screen.findByRole('textbox', { name: 'Rationale for response area #1 Rationale for Alpha (correct)' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Rationale for response area #2 Rationale for Alpha (incorrect)' })).toBeInTheDocument();
  expect(screen.getAllByRole('textbox')).toHaveLength(6);
});
