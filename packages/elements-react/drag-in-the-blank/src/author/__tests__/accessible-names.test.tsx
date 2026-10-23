import React from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Main from '../main.js';
import defaults from '../defaults.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

it('names the template and the configured authoring fields', async () => {
  render(<Main model={{ ...defaults.model, slateMarkup: '<p>Fill the blank.</p>' }}
    configuration={{ ...defaults.configuration, settingsPanelDisabled: true }}
    onModelChanged={vi.fn()} onConfigurationChanged={vi.fn()} />);
  for (const label of ['Teacher Instructions', 'Prompt', 'Response template', 'Rationale']) {
    expect(await screen.findByRole('textbox', { name: label })).toBeTruthy();
  }
});
