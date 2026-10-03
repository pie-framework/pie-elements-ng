import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import GraphWithControls from '../graph-with-controls';

// the axes also read labelStep, which the shared DomainType does not declare
const domain = { min: -5, max: 5, step: 1, labelStep: 1, axisLabel: '<div>x</div>' };
const range = { min: -2, max: 8, step: 1, labelStep: 1, axisLabel: 'y' };

const renderGraph = (props: object = {}) =>
  render(
    <GraphWithControls
      domain={domain}
      range={range}
      size={{ width: 300, height: 300 }}
      labels={{}}
      marks={[]}
      toolbarTools={['point', 'line']}
      onChangeMarks={() => {}}
      {...props}
    />,
  );

describe('graphing text alternative', () => {
  it('names the graph and describes its axes', () => {
    renderGraph();

    expect(screen.getByRole('group', { name: 'Coordinate graph' })).toHaveAccessibleDescription(
      'x axis from -5 to 5. y axis from -2 to 8. Nothing plotted.',
    );
  });

  it('names the graph by its title and lists what is plotted', () => {
    renderGraph({
      title: '<p>Linear <em>functions</em></p>',
      backgroundMarks: [{ type: 'point', x: 0, y: 0 }],
      marks: [
        { type: 'line', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
        { type: 'point', x: 2, y: 2, building: true },
      ],
    });

    expect(screen.getByRole('group', { name: 'Linear functions' })).toHaveAccessibleDescription(
      'x axis from -5 to 5. y axis from -2 to 8. 2 objects plotted: Point, Line.',
    );
  });

  it('names and describes the graph in the item language', () => {
    renderGraph({ language: 'es_ES', marks: [{ type: 'point', x: 1, y: 1 }] });

    expect(screen.getByRole('group', { name: 'Gráfica de coordenadas' })).toHaveAccessibleDescription(
      'Eje x de -5 a 5. Eje y de -2 a 8. 1 objeto trazado: Punto.',
    );
  });
});
