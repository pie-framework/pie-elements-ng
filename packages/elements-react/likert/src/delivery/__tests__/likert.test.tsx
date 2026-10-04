import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Likert from '../likert';

// Two element versions on a page each bundle their own lodash, whose uniqueId counters both
// start at 1; a constant reproduces that within this one module graph.
vi.mock('@pie-element/shared-lodash', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@pie-element/shared-lodash')>()),
  uniqueId: (prefix = '') => `${prefix}1`,
}));

const theme = createTheme();

const choices = [
  { label: '<strong>Disagree</strong>', value: -1 },
  { label: 'Neutral', value: 0 },
  { label: 'Agree', value: 1 },
];

const likert = (likertOrientation = 'horizontal', value = 0) => (
  <ThemeProvider theme={theme}>
    <Likert
      choices={choices}
      disabled={false}
      likertOrientation={likertOrientation}
      onSessionChange={vi.fn()}
      session={{ value }}
    />
  </ThemeProvider>
);

const renderLikert = (likertOrientation = 'horizontal') => render(likert(likertOrientation));

const pageIds = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

describe('Likert choice names', () => {
  it.each(['horizontal', 'vertical'])('names each radio from its choice label (%s)', (orientation) => {
    renderLikert(orientation);

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Disagree' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Neutral' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Agree' })).not.toBeChecked();
  });
});

describe('Likert ids', () => {
  it('stay unique when two items share a page', () => {
    renderLikert();
    renderLikert();

    expect(screen.getAllByRole('radio', { name: 'Agree' })).toHaveLength(2);
    expect(new Set(pageIds()).size).toBe(pageIds().length);
  });

  it('stay the same across re-renders', () => {
    const { rerender } = render(likert('horizontal', 0));
    const before = pageIds();

    rerender(likert('horizontal', 1));

    expect(screen.getByRole('radio', { name: 'Agree' })).toBeChecked();
    expect(pageIds()).toEqual(before);
  });
});
