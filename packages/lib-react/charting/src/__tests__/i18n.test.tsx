import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { chartAlternative } from '../chart';
import KeyLegend from '../key-legend';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const categories = [{ label: 'Apples' }, { label: 'Pears' }];
const range = { min: 0, max: 5 };
const describeChart = (language: string, list = categories, onLoad?: () => void) =>
  chartAlternative({ title: '', chartType: 'bar', categories: list, range, language, onLoad });

// The catalog for a language loads on first use: one English frame, then the language.
describe('charting interface language', () => {
  it('describes the chart in Spanish once its catalog lands', async () => {
    const onLoad = vi.fn();
    const first = describeChart('es_ES', categories, onLoad);

    expect(first.ariaLabel).toBe('Bar chart');
    await waitFor(() => expect(onLoad).toHaveBeenCalled());

    expect(describeChart('es_ES')).toEqual({
      ariaLabel: 'Gráfico de barras',
      ariaDescription: 'Gráfico de barras. 2 categorías: Apples, Pears. Valores de 0 a 5.',
    });
    expect(describeChart('es_ES', []).ariaDescription).toBe('Gráfico de barras. Sin categorías. Valores de 0 a 5.');
  });

  it('picks the Romanian plural form by count', async () => {
    const onLoad = vi.fn();
    describeChart('ro', categories, onLoad);
    await waitFor(() => expect(onLoad).toHaveBeenCalled());

    const many = Array.from({ length: 20 }, (_, i) => ({ label: `C${i + 1}` }));
    expect(describeChart('ro', categories.slice(0, 1)).ariaDescription).toContain('1 categorie: Apples.');
    expect(describeChart('ro').ariaDescription).toContain('2 categorii: Apples, Pears.');
    expect(describeChart('ro', many).ariaDescription).toContain('20 de categorii:');
  });

  it('renders the legend in Spanish, and follows a language change', async () => {
    const { rerender } = render(<KeyLegend language="es" />);

    expect(await screen.findByText('Clave')).toBeInTheDocument();

    rerender(<KeyLegend language="fr" />);
    expect(await screen.findByText('Légende')).toBeInTheDocument();
  });
});
