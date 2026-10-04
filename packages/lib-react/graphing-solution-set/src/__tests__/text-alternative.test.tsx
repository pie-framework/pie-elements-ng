import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import Graph from '../graph';
import { toolsArr } from '../tools/index';

// the axes also read labelStep, which the shared DomainType does not declare
const domain = { min: -10, max: 10, step: 1, labelStep: 1, axisLabel: '<div>x</div>' };
const range = { min: -10, max: 10, step: 1, labelStep: 1, axisLabel: '<div>y</div>' };
const size = { width: 300, height: 300 };

const square = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
];

const renderGraph = (props: object = {}) =>
  render(
    <Graph
      domain={domain}
      range={range}
      size={size}
      labels={{}}
      tools={toolsArr}
      marks={[
        { type: 'line', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
        { type: 'polygon', closed: true, points: square, isSolution: true },
        { type: 'polygon', closed: true, points: square, isSolution: false },
      ]}
      {...props}
    />,
  );

describe('graphing-solution-set text alternative', () => {
  it('describes the axes, the lines and the shaded solution regions', () => {
    renderGraph({ title: 'System of inequalities' });

    expect(screen.getByRole('group', { name: 'System of inequalities' })).toHaveAccessibleDescription(
      'x axis from -10 to 10. y axis from -10 to 10. 2 objects plotted: Shaded region, Line.',
    );
  });

  it('names and describes the graph in the item language', () => {
    renderGraph({ language: 'es_ES', marks: [] });

    expect(screen.getByRole('group', { name: 'Gráfica de coordenadas' })).toHaveAccessibleDescription(
      'Eje x de -10 a 10. Eje y de -10 a 10. Nada trazado.',
    );
  });
});
