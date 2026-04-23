import { describe, expect, it } from 'vitest';
import { buildKeyDefinitions, laneDefinitions, toColumnMajor, toLaneGrid } from '../src/keypad/model';

describe('keypad model', () => {
  it('orders rows in column-major layout', () => {
    const ordered = toColumnMajor([
      [{ label: '7' }, { label: '8' }],
      [{ label: '4' }, { label: '5' }],
      [{ label: '1' }, { label: '2' }],
      [{ label: '0' }, { label: '.' }],
      [{ label: 'left' }, { label: 'right' }],
    ]);

    expect(ordered.map((k) => k.label)).toEqual(['7', '4', '1', '0', 'left', '8', '5', '2', '.', 'right']);
  });

  it('classifies keypad lanes by semantics', () => {
    const defs = buildKeyDefinitions([
      { label: '7' },
      { label: '+', category: 'operators' },
      { latex: '\\frac{x}{ }', name: 'X/blank' },
    ]);
    const lanes = laneDefinitions(defs);

    expect(lanes.numbers).toHaveLength(1);
    expect(lanes.operators).toHaveLength(1);
    expect(lanes.templates).toHaveLength(1);
    expect(lanes.templates[0].visualType).toBe('fractionTemplate');
  });

  it('builds fixed 5-row lane grids', () => {
    const defs = buildKeyDefinitions([{ label: '7' }, { label: '4' }, { label: '1' }, { label: '0' }, { label: 'left' }]);
    const grid = toLaneGrid(defs, 5);
    expect(grid).toHaveLength(5);
    expect(grid[0][0]?.key.label).toBe('7');
    expect(grid[4][0]?.key.label).toBe('left');
  });

  it('maps all LaTeX keypad visuals to deterministic types', () => {
    const latexKeys = [
      '\\frac{}{}',
      '\\frac{x}{ }',
      'x\\frac{}{}',
      '\\longdiv{}',
      'x^2',
      'x^{}',
      'x_{}',
      '\\sqrt{}',
      '\\sqrt[{}]{}',
      '\\left(\\right)',
      '\\left[\\right]',
      '\\abs{}',
      '\\log_{}',
      '\\overline{}',
      '\\overline{x}',
      '\\overline{y}',
      '\\overrightarrow{}',
      '\\overleftrightarrow{\\overline{}}',
      '\\overleftrightarrow{AB}',
      '\\overarc{\\overline{}}',
      '\\theta',
      '\\sin',
      '\\cos',
      '\\tan',
      '\\sec',
      '\\csc',
      '\\cot',
      '\\log',
      '\\ln',
      '\\pi',
      '\\infty',
      '\\propto',
      '\\pm',
      '\\approx',
      '\\napprox',
      '\\neq',
      '\\sim',
      '\\nsim',
      '\\mu',
      '\\Sigma',
      '\\sigma',
      '\\parallel',
      '\\nparallel',
      '\\perp',
      '\\angle',
      '\\measuredangle',
      '\\triangle',
      '\\square',
      '\\parallelogram',
      '\\odot',
      '\\degree',
      '\\cong',
      '\\ncong',
      '\\leftarrow',
      '\\rightarrow',
      '\\leftrightarrow',
      '\\le',
      '\\ge',
    ].map((latex) => ({ latex, name: latex }));

    const defs = buildKeyDefinitions(latexKeys);
    expect(defs).toHaveLength(latexKeys.length);
    expect(defs.every((d) => d.visualType !== 'text' && d.visualType !== 'icon')).toBe(true);
    expect(defs.some((d) => d.visualType === 'symbolText')).toBe(true);
  });
});
