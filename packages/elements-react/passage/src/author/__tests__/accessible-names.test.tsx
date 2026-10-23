import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PassageComponent as PassageImport } from '../passage.js';
import defaults from '../defaults.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
const Passage = PassageImport as unknown as React.ComponentType<Record<string, unknown>>;
const model = { ...defaults.model, passages: [defaults.model.passages[0], defaults.model.passages[0]] };
const passages = (titleLabel = 'Title', order = [0, 1]) => <>{order.map((index) => (
  <Passage key={index} passageIndex={index} model={model}
    configuration={{ ...defaults.configuration, title: { ...defaults.configuration.title, label: titleLabel } }}
    onModelChanged={vi.fn()} />
))}</>;

describe('passage authoring field names', () => {
  it('distinguishes repeated fields and follows configured labels on rerender', async () => {
    const { rerender } = render(passages());
    for (const number of [1, 2]) {
      for (const label of ['Teacher Instructions', 'Title', 'Subtitle', 'Author', 'Text']) {
        expect(await screen.findByRole('textbox', { name: `${label} for passage ${number}` })).toBeTruthy();
      }
    }
    expect(screen.getAllByRole('textbox')).toHaveLength(10);
    rerender(passages('Passage heading', [1, 0]));
    expect(await screen.findByRole('textbox', { name: 'Passage heading for passage 2' })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: 'Title for passage 2' })).toBeNull();
  });
});
