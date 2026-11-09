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

describe('multiple-choice image-only choices (PIE-1484)', () => {
  it('asks for alt text on an image choice with no text and no alt', async () => {
    const withImages = {
      ...model,
      choices: [
        { label: '<img src="a.png" alt="">', value: '0', correct: true },
        { label: '<img src="b.png" alt="A red triangle">', value: '1', correct: false },
        { label: '<img src="c.png" alt="" data-type="image-upload-node">', value: '2', correct: false },
      ],
    };
    render(
      <Main model={withImages} configuration={configuration} onModelChanged={vi.fn()} onConfigurationChanged={vi.fn()} />,
    );

    expect(await screen.findAllByText(/Add alt text to the image/)).toHaveLength(2);
  });
});
