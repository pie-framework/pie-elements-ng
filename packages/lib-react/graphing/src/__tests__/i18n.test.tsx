import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { graphAlternative } from '../graph';
import UndoRedo from '../undo-redo';

const domain = { min: -5, max: 5 };
const range = { min: -2, max: 8 };
const marks = [
  { type: 'point', x: 0, y: 0 },
  { type: 'segment', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
];

// The catalog for a language loads on first use: one English frame, then the language.
describe('graphing interface language', () => {
  it('describes the graph in Spanish once its catalog lands', async () => {
    const onLoad = vi.fn();
    const first = graphAlternative({ title: '', domain, range, marks, language: 'es_ES', onLoad });

    expect(first.ariaLabel).toBe('Coordinate graph');
    await waitFor(() => expect(onLoad).toHaveBeenCalled());

    // the trailing space the carried Spanish 'Segmento ' has does not reach the list
    expect(graphAlternative({ title: '', domain, range, marks, language: 'es_ES', onLoad: undefined })).toEqual({
      ariaLabel: 'Gráfica de coordenadas',
      ariaDescription: 'Eje x de -5 a 5. Eje y de -2 a 8. 2 objetos trazados: Punto, Segmento.',
    });
  });

  it('relabels its buttons in Spanish, and follows a language change', async () => {
    const undoRedo = (language: string) => (
      <UndoRedo onUndo={vi.fn()} onRedo={vi.fn()} onReset={vi.fn()} language={language} />
    );
    const { rerender } = render(undoRedo('es'));

    expect(await screen.findByRole('button', { name: 'Deshacer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rehacer' })).toBeInTheDocument();

    rerender(undoRedo('fr'));
    expect(await screen.findByRole('button', { name: 'Annuler' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réinitialiser' })).toBeInTheDocument();
  });
});
