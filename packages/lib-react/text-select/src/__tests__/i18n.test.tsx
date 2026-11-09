import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Legend } from '../legend';
import TokenSelect from '../token-select';

const tokens = [{ text: 'The storm hit at dawn.', start: 0, end: 22, selectable: true }];

// The catalog for a language loads on first use: one English frame, then the language.
describe('text-select interface language', () => {
  it('renders the legend in Spanish once its catalog lands, and follows a language change', async () => {
    const { rerender } = render(<Legend language="es_ES" showOnlyCorrect={false} />);

    expect(screen.getByText('Key')).toBeInTheDocument();
    expect(await screen.findByText('Clave')).toBeInTheDocument();
    expect(screen.getByText('Respuesta Correcta')).toBeInTheDocument();

    rerender(<Legend language="fr" showOnlyCorrect={false} />);
    expect(await screen.findByText('Légende')).toBeInTheDocument();
  });

  it('names the token group in Spanish, and follows a language change', async () => {
    const tokenSelect = (language: string) => (
      <TokenSelect tokens={tokens} maxNoOfSelections={2} onChange={vi.fn()} language={language} />
    );
    const { rerender } = render(tokenSelect('es'));

    expect(await screen.findByRole('group', { name: 'Texto seleccionable, selecciona hasta 2' })).toBeInTheDocument();

    rerender(tokenSelect('en-US'));
    expect(screen.getByRole('group', { name: 'Selectable text, select up to 2' })).toBeInTheDocument();
  });
});
