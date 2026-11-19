import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Main } from '../design.js';
import defaults from '../defaults.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const passage = (title: string) => ({ ...defaults.model.passages[0], title });

const renderMain = (passages: ReturnType<typeof passage>[], max?: number | null) => {
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

const renderControlled = (passages: ReturnType<typeof passage>[]) => {
  const onModelChanged = vi.fn();
  const configuration = {
    ...defaults.configuration,
    additionalPassage: { ...defaults.configuration.additionalPassage, enabled: true },
  };
  const props = { model: { ...defaults.model, passages }, configuration, onModelChanged } as unknown as React.ComponentProps<
    typeof Main
  >;
  const { rerender } = render(<Main {...props} />);
  return { rerender, props, onModelChanged };
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

  it('keeps adding when the cap is null', () => {
    renderMain([passage('a'), passage('b'), passage('c')], null);
    expect(screen.getByRole('button', { name: /^Add Additional Passage/ })).toBeTruthy();
  });

  it('keeps adding when the cap is 0', () => {
    renderMain([passage('a'), passage('b'), passage('c')], 0);
    expect(screen.getByRole('button', { name: /^Add Additional Passage/ })).toBeTruthy();
  });

  it('numbers each Remove button by its passage', () => {
    renderMain([passage('a'), passage('b'), passage('c')]);
    expect(screen.getAllByRole('button', { name: /^Remove passage/ })).toEqual([
      screen.getByRole('button', { name: 'Remove passage 2' }),
      screen.getByRole('button', { name: 'Remove passage 3' }),
    ]);
  });

  it('reorders any passage, the first included', () => {
    const onModelChanged = renderMain([passage('a'), passage('b'), passage('c')]);
    expect(screen.getAllByRole('button', { name: /up$/ })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Move passage 1 down' }));
    expect(onModelChanged.mock.calls[0][0].passages.map((p: { title: string }) => p.title)).toEqual(['b', 'a', 'c']);
  });

  it('keeps focus on the moved passage when its button disappears', () => {
    const { rerender, props, onModelChanged } = renderControlled([passage('a'), passage('b'), passage('c')]);
    const up = screen.getByRole('button', { name: 'Move passage 2 up' });
    up.focus();
    fireEvent.click(up);
    rerender(<Main {...props} model={onModelChanged.mock.calls[0][0]} />);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Move passage 1 down' }));
  });
});
