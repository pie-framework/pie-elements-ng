import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import ImageContainer from '../image-container';

const theme = createTheme();

const responseContainers = [0, 1, 2].map((index) => ({
  id: `rc-${index}`,
  index,
  x: index * 30,
  y: 10,
  width: '20%',
  height: '20%',
}));

const tree = (extras?: any) => (
  <ThemeProvider theme={theme}>
      <DndContext>
        <ImageContainer
          answers={[{ id: 'a1', value: 'Mercury', containerIndex: 1 }]}
          canDrag={true}
          draggingElement={{}}
          image={{ src: 'planets.png', width: 400, height: 200 }}
          onAnswerSelect={vi.fn()}
          onDragAnswerBegin={vi.fn()}
          onDragAnswerEnd={vi.fn()}
          responseContainers={responseContainers}
          {...extras}
        />
      </DndContext>
    </ThemeProvider>
);

const renderImageContainer = (extras?: any) => render(tree(extras));

describe('ImageContainer drop targets', () => {
  it('name each empty target by its position', () => {
    renderImageContainer();

    expect(screen.getByRole('button', { name: 'Response area 1 of 3' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: 'Response area 3 of 3' })).toHaveAttribute('tabindex', '0');
    // The filled target is a group that leaves its tab stop to the answer it holds.
    const filled = screen.getByRole('group', { name: 'Response area 2 of 3' });
    expect(filled).toHaveAttribute('tabindex', '-1');
    expect(within(filled).getByRole('button', { name: 'Mercury' })).toHaveAttribute(
      'aria-roledescription',
      'draggable',
    );
  });

  it('name the targets in the item language', () => {
    renderImageContainer({ language: 'es_ES' });

    expect(screen.getByRole('button', { name: 'Área de respuesta 1 de 3' })).toBeInTheDocument();
  });

  it('place the selection with Enter, Space or a click on an empty target', () => {
    const onPlacementClick = vi.fn();
    renderImageContainer({ selectedResponse: { id: 'a2', value: 'Venus' }, onPlacementClick });
    const target = screen.getByRole('button', { name: 'Response area 3 of 3' });

    fireEvent.keyDown(target, { code: 'Enter' });
    fireEvent.keyDown(target, { code: 'Space' });
    fireEvent.click(target);

    expect(onPlacementClick).toHaveBeenCalledTimes(3);
    expect(onPlacementClick).toHaveBeenCalledWith(2);
  });

  it('keep the name on a focused target once a keyboard placement fills it', () => {
    const { rerender } = renderImageContainer({ selectedResponse: { id: 'a2', value: 'Venus' } });
    screen.getByRole('button', { name: 'Response area 3 of 3' }).focus();

    rerender(
      tree({
        answers: [
          { id: 'a1', value: 'Mercury', containerIndex: 1 },
          { id: 'a2', value: 'Venus', containerIndex: 2 },
        ],
      }),
    );

    expect(screen.getByRole('group', { name: 'Response area 3 of 3' })).toHaveFocus();
  });

  it('drop the targets out of the tab order when dragging is off', () => {
    renderImageContainer({ canDrag: false });

    expect(screen.queryByRole('button', { name: /Response area/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: /Response area/ })).toHaveLength(3);
  });
});
