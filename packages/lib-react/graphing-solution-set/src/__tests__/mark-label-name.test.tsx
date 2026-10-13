import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import GraphWithControls from '../graph-with-controls';

// the axes also read labelStep, which the shared DomainType does not declare
const axis = { min: -5, max: 5, step: 1, labelStep: 1 };

const line = { type: 'line', from: { x: 0, y: 1, label: 'A' }, to: { x: 2, y: 3, label: 'B' } };
const polygon = {
  type: 'polygon',
  closed: true,
  isSolution: true,
  points: [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
  ],
  middle: { x: 3, y: 1, label: 'R' },
};

const renderGraph = (language?: string, marks: object[] = [line]) =>
  render(
    <GraphWithControls
      domain={axis}
      range={axis}
      size={{ width: 300, height: 300 }}
      labels={{}}
      marks={marks}
      toolbarTools={['line', 'polygon']}
      onChangeMarks={() => {}}
      language={language}
    />,
  );

describe('graphing-solution-set mark label inputs', () => {
  it('names each line end label by the point it labels', () => {
    renderGraph();

    expect(screen.getByRole('textbox', { name: 'Label at (0, 1)' })).toHaveValue('A');
    expect(screen.getByRole('textbox', { name: 'Label at (2, 3)' })).toHaveValue('B');
  });

  it('names the labels in the item language', () => {
    renderGraph('es_ES');

    expect(screen.getByRole('textbox', { name: 'Etiqueta en (0, 1)' })).toHaveValue('A');
  });

  it('exposes a label outside label mode as disabled', () => {
    renderGraph();

    expect(screen.getByRole('textbox', { name: 'Label at (0, 1)' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Label at (2, 3)' })).toBeDisabled();
  });

  it('renders a polygon label, named in the item language', () => {
    renderGraph('es_ES', [polygon]);

    const label = screen.getByRole('textbox', { name: 'Etiqueta en (3, 1)' });

    expect(label).toHaveValue('R');
    expect(label).toBeDisabled();
  });
});
