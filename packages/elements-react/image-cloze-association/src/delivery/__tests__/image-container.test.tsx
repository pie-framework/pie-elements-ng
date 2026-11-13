import React from 'react';
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { loadLocale } from '@pie-element/shared-i18n';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import ImageContainer from '../image-container';

const theme = createTheme();

// The components read their catalogs synchronously; the Spanish cases need them resident.
beforeAll(() => loadLocale('es_ES'));

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
  it('leave the tab path to the answers while nothing is selected, named by their position', () => {
    renderImageContainer();

    for (const name of ['Response area 1 of 3', 'Response area 2 of 3', 'Response area 3 of 3']) {
      expect(screen.getByRole('group', { name })).toHaveAttribute('tabindex', '-1');
    }
    expect(screen.queryByRole('button', { name: /Response area/ })).not.toBeInTheDocument();
    const answer = within(screen.getByRole('group', { name: 'Response area 2 of 3' })).getByRole('button', {
      name: 'Mercury',
    });
    expect(answer).toHaveAttribute('aria-roledescription', 'draggable');
    expect(answer).toHaveAttribute('tabindex', '0');
  });

  it('are all tab stops while a choice is selected, and the answers in them are not', () => {
    renderImageContainer({ selectedResponse: { id: 'a2', value: 'Venus' } });

    // An empty target is a button; a filled one a group, as a button would hide the answers it holds.
    expect(screen.getByRole('button', { name: 'Response area 1 of 3' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: 'Response area 3 of 3' })).toHaveAttribute('tabindex', '0');
    const filled = screen.getByRole('group', { name: 'Response area 2 of 3' });
    expect(filled).toHaveAttribute('tabindex', '0');
    expect(within(filled).getByRole('button', { name: 'Mercury' })).toHaveAttribute('tabindex', '-1');
  });

  it('name the targets in the item language', () => {
    renderImageContainer({ language: 'es_ES' });

    expect(screen.getByRole('group', { name: 'Área de respuesta 1 de 3' })).toBeInTheDocument();
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

  it('place the selection with Enter on a filled target', () => {
    const onPlacementClick = vi.fn();
    renderImageContainer({ selectedResponse: { id: 'a2', value: 'Venus' }, onPlacementClick });

    fireEvent.keyDown(screen.getByRole('group', { name: 'Response area 2 of 3' }), { code: 'Enter' });

    expect(onPlacementClick).toHaveBeenCalledWith(1);
  });

  it('leave a key pressed on an answer to the answer, so a keyboard drag can drop it', () => {
    const onPlacementClick = vi.fn();
    renderImageContainer({ selectedResponse: { id: 'a1', value: 'Mercury', containerIndex: 1 }, onPlacementClick });

    fireEvent.keyDown(screen.getByRole('button', { name: 'Mercury' }), { code: 'Enter' });

    expect(onPlacementClick).not.toHaveBeenCalled();
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

  it('name a target by its authored label, in place of its position', () => {
    renderImageContainer({
      responseContainers: responseContainers.map((container, index) => ({
        ...container,
        ariaLabel: ['Stem', '  Leaf  ', ' '][index],
      })),
    });

    expect(screen.getByRole('group', { name: 'Stem' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Leaf' })).toBeInTheDocument();
    // a blank label leaves the position name
    expect(screen.getByRole('group', { name: 'Response area 3 of 3' })).toBeInTheDocument();
  });

  it('drop the targets out of the tab order when dragging is off', () => {
    renderImageContainer({ canDrag: false, selectedResponse: { id: 'a2', value: 'Venus' } });

    expect(screen.queryByRole('button', { name: /Response area/ })).not.toBeInTheDocument();
    const targets = screen.getAllByRole('group', { name: /Response area/ });
    expect(targets).toHaveLength(3);
    for (const target of targets) {
      expect(target).toHaveAttribute('tabindex', '-1');
    }
  });
});

describe('ImageContainer image', () => {
  it('describes the image by its number of response areas', () => {
    renderImageContainer();

    expect(screen.getByRole('img', { name: 'Image with 3 response areas' })).toHaveAttribute('src', 'planets.png');
  });

  it('describes the image in the item language', () => {
    renderImageContainer({ language: 'es_ES', responseContainers: responseContainers.slice(0, 1) });

    expect(screen.getByRole('img', { name: 'Imagen con 1 área de respuesta' })).toBeInTheDocument();
  });
});
