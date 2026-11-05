import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Main } from '../design.js';
import defaults from '../defaults.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const passage = (title: string) => ({ ...defaults.model.passages[0], title });

const renderMain = (passages: ReturnType<typeof passage>[], max?: number) => {
  const onModelChanged = vi.fn();
  const configuration = {
    ...defaults.configuration,
    additionalPassage: { ...defaults.configuration.additionalPassage, enabled: true, max },
  };
  const props = { model: { ...defaults.model, passages }, configuration, onModelChanged } as unknown as React.ComponentProps<
    typeof Main
  >;
  render(<Main {...props} />);
  return onModelChanged;
};

describe('additional passages', () => {
  it('adds a passage beyond the second', () => {
    const onModelChanged = renderMain([passage('a'), passage('b')]);
    fireEvent.click(screen.getByRole('button', { name: /^Add Additional Passage/ }));
    expect(onModelChanged.mock.calls[0][0].passages).toHaveLength(3);
  });

  it('stops adding at the configured maximum', () => {
    renderMain([passage('a'), passage('b'), passage('c')], 3);
    expect(screen.queryByRole('button', { name: /^Add Additional Passage/ })).toBeNull();
  });

  it('reorders additional passages and keeps the first in place', () => {
    const onModelChanged = renderMain([passage('a'), passage('b'), passage('c')]);
    expect(screen.getAllByRole('button', { name: /up$/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /down$/ }));
    expect(onModelChanged.mock.calls[0][0].passages.map((p: { title: string }) => p.title)).toEqual(['a', 'c', 'b']);
  });
});
