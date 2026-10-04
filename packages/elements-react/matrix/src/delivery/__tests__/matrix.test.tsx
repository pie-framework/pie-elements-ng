import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Matrix from '../Matrix';

// The prompt renders math through MathJax, which happy-dom cannot load.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
// Two element versions on a page each bundle their own lodash, whose uniqueId counters both
// start at 1; a constant reproduces that within this one module graph.
vi.mock('@pie-element/shared-lodash', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@pie-element/shared-lodash')>()),
  uniqueId: (prefix = '') => `${prefix}1`,
}));

const matrix = (value: Record<string, number> = { '1-0': 0 }) => (
  <Matrix
    columnLabels={['Disagree', 'Agree']}
    disabled={false}
    matrixValues={{ '0-0': 0, '0-1': 1, '1-0': 0, '1-1': 1 }}
    onSessionChange={vi.fn()}
    rowLabels={['Politics', 'Economics']}
    session={{ value }}
  />
);

const renderMatrix = () => render(matrix());

const pageIds = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

describe('Matrix radio names', () => {
  it('names each radio from its row and column labels', () => {
    renderMatrix();

    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByRole('radio', { name: 'Politics Disagree' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Politics Agree' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Economics Disagree' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Economics Agree' })).not.toBeChecked();
  });

  it('keeps ids distinct across matrices on one page', () => {
    renderMatrix();
    renderMatrix();

    expect(screen.getAllByRole('radio', { name: 'Politics Agree' })).toHaveLength(2);
    expect(new Set(pageIds()).size).toBe(pageIds().length);
  });

  it('keeps its ids across re-renders', () => {
    const { rerender } = render(matrix());
    const before = pageIds();

    rerender(matrix({ '0-1': 1 }));

    expect(screen.getByRole('radio', { name: 'Politics Agree' })).toBeChecked();
    expect(pageIds()).toEqual(before);
  });
});
