import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToolMenu from '../tool-menu';

const lineData = (numberOfLines: number) => ({
  numberOfLines,
  selectedTool: 'lineA',
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
  });
});
