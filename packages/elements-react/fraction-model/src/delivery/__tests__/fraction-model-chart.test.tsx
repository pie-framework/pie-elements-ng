import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import FractionModelChart from '../fraction-model-chart';

const props = {
  noOfModels: 2,
  partsPerModel: 4,
  onChange: vi.fn(),
};

describe('fraction model text alternative', () => {
  it.each(['bar', 'pie'])('names each %s model from its parts and selection', (modelType) => {
    render(<FractionModelChart {...props} modelType={modelType} value={[{ id: 1, value: 3 }]} />);

    expect(screen.getByRole('img', { name: 'Model 1 of 2: 3 of 4 parts selected' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Model 2 of 2: 0 of 4 parts selected' })).toBeInTheDocument();
  });

  it.each(['bar', 'pie'])('leaves each %s model a single tab stop with no application role', (modelType) => {
    const { container } = render(<FractionModelChart {...props} modelType={modelType} value={[]} />);

    expect(container.querySelector('[role="application"]')).toBeNull();
    const tabStops = [...container.querySelectorAll('[tabindex]')].filter((el) => el.getAttribute('tabindex') !== '-1');
    expect(tabStops).toEqual(screen.getAllByRole('img'));
  });

  it('updates the name when a part is selected', () => {
    const { container } = render(<FractionModelChart {...props} modelType="pie" value={[]} />);

    fireEvent.click(container.querySelectorAll('.recharts-pie-sector path')[1]);

    expect(screen.getByRole('img', { name: 'Model 1 of 2: 2 of 4 parts selected' })).toBeInTheDocument();
  });

  it('uses the singular for a one-part model and names it in the item language', () => {
    render(
      <FractionModelChart modelType="bar" noOfModels={1} partsPerModel={1} value={[{ id: 1, value: 1 }]} language="es_ES" />,
    );

    expect(screen.getByRole('img', { name: 'Modelo 1 de 1: 1 de 1 parte seleccionada' })).toBeInTheDocument();
  });
});
