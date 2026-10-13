import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import DragInTheBlankDroppableImpl from '../drag-in-the-blank-dp';

// The source is untyped, so its inferred props make every one required.
const DragInTheBlankDroppable = DragInTheBlankDroppableImpl as React.ComponentType<any>;

describe('DragInTheBlankDroppable', () => {
  it('keeps the padded choice board inside its column at its full minimum height', () => {
    const { container } = render(
      <DragInTheBlankDroppable id="board">
        <span>a</span>
      </DragInTheBlankDroppable>,
    );
    const board = container.querySelector('.board') as HTMLElement;

    expect(board.style.width).toBe('auto');
    expect(board.style.boxSizing).toBe('');
    expect(board.style.minHeight).toBe('100px');
  });
});
