import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Likert from '../likert';

const theme = createTheme();

const choices = [
  { label: '<strong>Disagree</strong>', value: -1 },
  { label: 'Neutral', value: 0 },
  { label: 'Agree', value: 1 },
];

const renderLikert = (likertOrientation = 'horizontal') =>
  render(
    <ThemeProvider theme={theme}>
      <Likert
        choices={choices}
        disabled={false}
        likertOrientation={likertOrientation}
        onSessionChange={vi.fn()}
        session={{ value: 0 }}
      />
    </ThemeProvider>,
  );

describe('Likert choice names', () => {
  it.each(['horizontal', 'vertical'])('names each radio from its choice label (%s)', (orientation) => {
    renderLikert(orientation);

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Disagree' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Neutral' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Agree' })).not.toBeChecked();
  });
});
