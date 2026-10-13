import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createGraphProps } from '@pie-lib/plot';

import GraphWithControls from '../graph-with-controls';
import MarkLabel from '../mark-label';

// the axes also read labelStep, which the shared DomainType does not declare
const axis = { min: -5, max: 5, step: 1, labelStep: 1 };
const size = { width: 300, height: 300 };

const renderGraph = (marks: object[], language?: string) =>
  render(
    <GraphWithControls
      domain={axis}
      range={axis}
      size={size}
      labels={{}}
      marks={marks}
      toolbarTools={['point', 'line', 'circle', 'polygon']}
      onChangeMarks={() => {}}
      language={language}
    />,
  );

describe('graphing mark label inputs', () => {
  it('names a point label by the point it labels', () => {
    renderGraph([{ type: 'point', x: 1, y: 2, label: 'A' }]);

    expect(screen.getByRole('textbox', { name: 'Label at (1, 2)' })).toHaveValue('A');
  });

  it('names the end point labels of lines, circles and polygons', () => {
    renderGraph([
      { type: 'line', from: { x: 0, y: 0, label: 'B' }, to: { x: 1, y: 1 } },
      { type: 'circle', root: { x: 2, y: 2 }, edge: { x: 3, y: 2, label: 'C' } },
      { type: 'polygon', closed: true, points: [{ x: -1, y: -1, label: 'D' }, { x: -2, y: -1 }, { x: -2, y: -3 }] },
    ]);

    expect(screen.getByRole('textbox', { name: 'Label at (0, 0)' })).toHaveValue('B');
    expect(screen.getByRole('textbox', { name: 'Label at (3, 2)' })).toHaveValue('C');
    expect(screen.getByRole('textbox', { name: 'Label at (-1, -1)' })).toHaveValue('D');
  });

  it('names the label in the item language', () => {
    renderGraph([{ type: 'point', x: 1.5, y: -2, label: 'A' }], 'es_ES');

    expect(screen.getByRole('textbox', { name: 'Etiqueta en (1.5, -2)' })).toHaveValue('A');
  });

  it('tells the student label from the correct label it is evaluated against', () => {
    render(
      <MarkLabel
        disabled
        graphProps={createGraphProps(axis, axis, size, () => null)}
        inputRef={() => {}}
        mark={{ x: 1, y: 2, label: 'A', correctness: 'correct', correctnesslabel: 'incorrect', correctlabel: 'B' }}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Label at (1, 2)' })).toHaveValue('A');
    expect(screen.getByRole('textbox', { name: 'Correct label at (1, 2)' })).toHaveValue('B');
  });
});
