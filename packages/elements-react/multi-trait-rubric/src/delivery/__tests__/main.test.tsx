import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MainComponent from '../main';

const model = {
  visible: true,
  pointLabels: true,
  description: true,
  scales: [
    {
      excludeZero: false,
      maxPoints: 1,
      scorePointsLabels: ['Developing', 'Proficient'],
      traitLabel: 'Trait',
      traits: [
        {
          name: 'Ideas',
          description: 'Develops a central idea',
          scorePointsDescriptors: ['Idea is unclear', 'Idea is clear'],
          standards: [],
        },
      ],
    },
  ],
};

// main.tsx is untyped, so its class declares no props.
const Main = MainComponent as unknown as React.ComponentType<{ model: typeof model; animationsDisabled?: boolean }>;

describe('Multi-trait rubric toggle', () => {
  it('is a button that reports and flips its expanded state', () => {
    render(<Main model={model} />);

    const toggle = screen.getByRole('button', { name: 'Show Rubric' });
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide Rubric' })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Show Rubric' })).toHaveAttribute('aria-expanded', 'false');
  });

  it.each([
    ['en_US', 'Show Rubric', 'Hide Rubric'],
    ['es_ES', 'Mostrar rúbrica', 'Ocultar rúbrica'],
  ])('names the toggle in the %s item language', (language, show, hide) => {
    render(<Main model={{ ...model, language } as typeof model} />);

    fireEvent.click(screen.getByRole('button', { name: show }));
    expect(screen.getByRole('button', { name: hide })).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders no toggle when animations are disabled', () => {
    render(<Main model={model} animationsDisabled />);

    expect(screen.queryByRole('button', { name: /Rubric/ })).toBeNull();
  });
});
