import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ToolMenu from '../tool-menu';
import UndoRedo from '../undo-redo';

const lineData = {
  numberOfLines: 2,
  selectedTool: 'lineA',
  lineA: { lineType: 'Solid' },
  lineB: { lineType: 'Dashed' },
};

// The catalog for a language loads on first use: one English frame, then the language.
describe('graphing-solution-set interface language', () => {
  it('renders the tool menu in Spanish once its catalog lands, and follows a language change', async () => {
    const { rerender } = render(<ToolMenu gssLineData={lineData} onChange={vi.fn()} language="es_ES" />);

    expect(screen.getByRole('radio', { name: 'Line A' })).toBeInTheDocument();
    expect(await screen.findByRole('radio', { name: 'Línea A' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Discontinua' })).toHaveLength(2);

    rerender(<ToolMenu gssLineData={lineData} onChange={vi.fn()} language="fr" />);
    expect(await screen.findByRole('radio', { name: 'Droite A' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Pointillée' })).toHaveLength(2);
  });

  it('relabels reset in Spanish, and follows a language change', async () => {
    const { rerender } = render(<UndoRedo onReset={vi.fn()} language="es" />);

    expect(await screen.findByRole('button', { name: 'Reiniciar' })).toBeInTheDocument();

    rerender(<UndoRedo onReset={vi.fn()} language="en-US" />);
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });
});
