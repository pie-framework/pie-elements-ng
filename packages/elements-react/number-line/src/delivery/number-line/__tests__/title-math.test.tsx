import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { renderMath } = vi.hoisted(() => ({ renderMath: vi.fn() }));

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath }));

import { NumberLine } from '../index';

const Line = NumberLine as unknown as React.ComponentType<Record<string, unknown>>;

const model = (title: string) => ({
  disabled: false,
  graph: {
    domain: { min: 0, max: 10 },
    ticks: { major: 1, minor: 1 },
    arrows: { left: true, right: true },
    width: 600,
    title,
  },
});

const renderLine = (title: string) =>
  render(
    <Line
      model={model(title)}
      answer={[]}
      onMoveElement={vi.fn()}
      onDeleteElements={vi.fn()}
      onAddElement={vi.fn()}
      onUndoElement={vi.fn()}
      onClearElements={vi.fn()}
    />,
  );

describe('number line title math', () => {
  beforeEach(() => renderMath.mockClear());

  it('typesets the title when it mounts, without waiting for the element observer', () => {
    const { getByText } = renderLine('<span>\\(x^2\\)</span>');

    const typeset = renderMath.mock.calls.map(([node]) => node as Element);
    expect(typeset.some((node) => node.contains(getByText('\\(x^2\\)')))).toBe(true);
  });

  it('typesets again when the title changes', () => {
    const { rerender } = renderLine('<span>\\(x^2\\)</span>');
    renderMath.mockClear();

    rerender(
      <Line
        model={model('<span>\\(y^2\\)</span>')}
        answer={[]}
        onMoveElement={vi.fn()}
        onDeleteElements={vi.fn()}
        onAddElement={vi.fn()}
        onUndoElement={vi.fn()}
        onClearElements={vi.fn()}
      />,
    );

    expect(renderMath).toHaveBeenCalled();
  });
});
