import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Matrix from '../Matrix';

// The prompt renders math through MathJax, which happy-dom cannot load.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const renderMatrix = () =>
  render(
    <Matrix
      columnLabels={['Disagree', 'Agree']}
      disabled={false}
      matrixValues={{ '0-0': 0, '0-1': 1, '1-0': 0, '1-1': 1 }}
      onSessionChange={vi.fn()}
      rowLabels={['Politics', 'Economics']}
      session={{ value: { '1-0': 0 } }}
    />,
  );

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
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
