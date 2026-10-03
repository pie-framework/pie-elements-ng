import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

const renderImageContainer = (extras?: any) =>
  render(
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
    </ThemeProvider>,
  );

describe('ImageContainer drop targets', () => {
  it('name each empty target by its position', () => {
    renderImageContainer();

    expect(screen.getByRole('button', { name: 'Response area 1 of 3' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: 'Response area 3 of 3' })).toHaveAttribute('tabindex', '0');
    // The filled target leaves its tab stop to the answer it holds.
    expect(screen.queryByRole('button', { name: 'Response area 2 of 3' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mercury' })).toHaveAttribute('aria-roledescription', 'draggable');
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

  it('drop the targets out of the tab order when dragging is off', () => {
    renderImageContainer({ canDrag: false });

    expect(screen.queryByRole('button', { name: /Response area/ })).not.toBeInTheDocument();
  });
});
