import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Chart from '../chart';
import chartTypes from '../chart-types';

// a fraction label renders through MathJax, which does not load here
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const charts = [chartTypes.Bar(), chartTypes.DotPlot()];

const data = [{ label: 'Apples', value: 2, interactive: true, editable: false }];

// React reports an unknown prop once per process, so this check has a file of its own to be sure to see the
// warning; the bar and the plot share RawDragHandle, so one drag covers both
describe('the bar drag handle', () => {
  it('does not put the drag wrapper\'s props on the DOM', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <Chart
        chartType="bar"
        charts={charts}
        data={data}
        domain={{ label: 'Fruit' }}
        range={{ label: 'Count', min: 0, max: 5, step: 1, labelStep: 1 }}
        size={{ width: 300, height: 300 }}
        onDataChange={() => {}}
      />,
    );
    const handle = screen.getByRole('slider', { name: 'Apples' }).querySelector('ellipse') as Element;

    fireEvent.mouseDown(handle, { clientX: 10, clientY: 100, button: 0 });
    fireEvent.mouseMove(handle, { clientX: 10, clientY: 60, button: 0 });
    fireEvent.mouseUp(document.body, { clientX: 10, clientY: 60, button: 0 });

    const warned = error.mock.calls.map((call) => call.map(String).join(' '));
    error.mockRestore();

    expect(warned.filter((m) => /isDragging|onDragStop|onDragStart|non-boolean|Unknown event handler/.test(m))).toEqual([]);
  });
});
