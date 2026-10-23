import React from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScaleImport from '../scale.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
const Scale = ScaleImport as unknown as React.ComponentType<Record<string, unknown>>;

it('distinguishes labels, traits and descriptors across scales', async () => {
  const scale = { maxPoints: 1, traitLabel: 'Trait', scorePointsLabels: ['Needs work', 'Meets expectations'], traits: [
    { name: 'Clarity', standards: ['ELA'], description: 'Clear writing', scorePointsDescriptors: ['Unclear', 'Clear'] },
  ] };
  render(<>{[0, 1].map((scaleIndex) => <Scale key={scaleIndex} scaleIndex={scaleIndex} scale={scale}
    width="1000" excludeZero={false} showStandards showDescription showLevelTagInput showScorePointLabels
    maxPointsEnabled maxMaxPoints={3} onScaleChanged={vi.fn()} onScaleRemoved={vi.fn()} />)}</>);
  for (const number of [1, 2]) {
    for (const label of ['Level Label', 'Score 1 label', 'Score 0 label']) {
      expect(await screen.findByRole('textbox', { name: `${label} for scale ${number}` })).toBeInTheDocument();
    }
    expect(screen.getByRole('combobox', { name: `Max Points for scale ${number}` })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: `Trait 1 name in scale ${number}` })).toBeInTheDocument();
    for (const label of ['Standards', 'Description']) {
      expect(screen.getByRole('textbox', { name: `${label} for trait 1 in scale ${number}` })).toBeInTheDocument();
    }
    for (const score of [0, 1]) {
      expect(screen.getByRole('textbox', { name: `Descriptor for score ${score} in trait 1 in scale ${number}` })).toBeInTheDocument();
    }
  }
  expect(screen.getAllByRole('textbox')).toHaveLength(16);
});
