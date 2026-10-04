import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToolMenu from '../tool-menu';

// Two element versions on a page each bundle their own lodash, whose uniqueId counters both
// start at 1; a constant reproduces that within this one module graph.
vi.mock('@pie-element/shared-lodash', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@pie-element/shared-lodash')>()),
  uniqueId: (prefix = '') => `${prefix}1`,
}));

const lineData = (numberOfLines: number, selectedTool = 'lineA') => ({
  numberOfLines,
  selectedTool,
  lineA: { lineType: 'Solid' },
  lineB: { lineType: 'Dashed' },
});

describe('ToolMenu line selection', () => {
  it('names each radio from its visible line name', () => {
    render(<ToolMenu gssLineData={lineData(2)} onChange={vi.fn()} />);

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Line A' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Line B' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Solution Set' })).not.toBeChecked();
  });

  it('keeps the names unique across menus on one page', () => {
    render(
      <>
        <ToolMenu gssLineData={lineData(1)} onChange={vi.fn()} />
        <ToolMenu gssLineData={lineData(1)} onChange={vi.fn()} disabled />
      </>,
    );

    const lineARadios = screen.getAllByRole('radio', { name: 'Line A' });
    expect(lineARadios).toHaveLength(2);
    expect(lineARadios[0].getAttribute('aria-labelledby')).not.toBe(
      lineARadios[1].getAttribute('aria-labelledby'),
    );
    expect(lineARadios[0].getAttribute('name')).not.toBe(lineARadios[1].getAttribute('name'));
  });

  it('keeps its ids across re-renders', () => {
    const ids = () => [...document.querySelectorAll('[id]')].map((el) => el.id);
    const { rerender } = render(<ToolMenu gssLineData={lineData(2)} onChange={vi.fn()} />);
    const before = ids();

    rerender(<ToolMenu gssLineData={lineData(2, 'lineB')} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Line B' })).toBeChecked();
    expect(ids()).toEqual(before);
  });
});
