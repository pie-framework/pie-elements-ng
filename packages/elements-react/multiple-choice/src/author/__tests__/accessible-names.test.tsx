import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Main from '../main.js';
import defaults from '../defaults.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const model = {
  ...defaults.model,
  choiceMode: 'radio' as const,
  choices: ['Paris', 'London', 'Madrid'].map((label, index) => ({
    label,
    value: String(index),
    correct: index === 0,
    rationale: `${label} explanation`,
  })),
};
const configuration = { ...defaults.configuration, settingsPanelDisabled: true };
const author = (promptLabel = 'Prompt') => (
  <Main
    model={model}
    configuration={{ ...configuration, prompt: { ...configuration.prompt, label: promptLabel } }}
    onModelChanged={vi.fn()}
    onConfigurationChanged={vi.fn()}
  />
);

describe('multiple-choice authoring field names', () => {
  it('names every rich-text field and correct-answer control', async () => {
    const { rerender } = render(author());

    expect(await screen.findByRole('textbox', { name: 'Teacher Instructions' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Prompt' })).toBeInTheDocument();
    for (const identifier of ['A', 'B', 'C']) {
      expect(screen.getByRole('textbox', { name: `Choice ${identifier}` })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: `Rationale for choice ${identifier}` })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: `Correct answer for choice ${identifier}` })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('textbox')).toHaveLength(8);

    rerender(author('Question text'));
    expect(await screen.findByRole('textbox', { name: 'Question text' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Prompt' })).not.toBeInTheDocument();
  });
});
