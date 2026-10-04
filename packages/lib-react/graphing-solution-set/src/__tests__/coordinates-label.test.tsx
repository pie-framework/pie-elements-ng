import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import GraphWithControls from '../graph-with-controls';

// the axes also read labelStep, which the shared DomainType does not declare
const axis = { min: -5, max: 5, step: 1, labelStep: 1 };

describe('graphing-solution-set hover coordinates', () => {
  it('shows the hovered point as text, with no form field', () => {
    const { container } = render(
      <GraphWithControls
        domain={axis}
        range={axis}
        size={{ width: 300, height: 300 }}
        labels={{}}
        marks={[{ type: 'line', from: { x: 0, y: 1 }, to: { x: 2, y: 3 } }]}
        toolbarTools={['line', 'polygon']}
        coordinatesOnHover
        onChangeMarks={() => {}}
      />,
    );
    // each point has a transparent hit area around it
    const hitArea = [...container.querySelectorAll('circle')].find((c) => c.style.fill === 'transparent');

    fireEvent.mouseEnter(hitArea as SVGCircleElement);

    const coordinates = screen.getByText('(0, 1)');
    // the labels layer the coordinates are drawn into
    const labelLayer = coordinates.closest('foreignObject');

    expect(labelLayer).not.toBeNull();
    expect(labelLayer?.querySelector('input, textarea, [role="textbox"]')).toBeNull();
  });
});
