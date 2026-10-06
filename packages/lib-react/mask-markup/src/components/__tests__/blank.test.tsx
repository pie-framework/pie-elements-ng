import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DndContext, useDraggable } from '@dnd-kit/core';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// MathJax loads off a CDN and has no bearing on the blank's semantics.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Blank } = await import('../blank');

const theme = createTheme();

const tree = (extras?: any) => (
  <ThemeProvider theme={theme}>
    <DndContext>
      <p>
        The <Blank id="1" instanceId="dib" onChange={vi.fn()} {...extras} /> is the largest planet.
      </p>
    </DndContext>
  </ThemeProvider>
);

const renderBlank = (extras?: any) => render(tree(extras));

describe('Blank', () => {
  it('names an empty blank by its position', () => {
    renderBlank();

    expect(screen.getByRole('button', { name: 'Blank 2' })).toHaveAttribute('tabindex', '0');
  });

  it('lays out the named target as the chip box, so it is at least 24px tall', () => {
    renderBlank();

    // An inline span measures one text line (18px); an inline-flex box wraps its 32px chip.
    expect(getComputedStyle(screen.getByRole('button', { name: 'Blank 2' })).display).toBe('inline-flex');
  });

  it('names an empty blank in the item language', () => {
    renderBlank({ language: 'es_ES' });

    expect(screen.getByRole('button', { name: 'Espacio en blanco 2' })).toBeInTheDocument();
  });

  it('is a named group that leaves its tab stop to the answer it holds', () => {
    renderBlank({ choice: { id: 'c1', value: 'Jupiter' } });

    const blank = screen.getByRole('group', { name: 'Blank 2' });
    expect(blank).toHaveAttribute('tabindex', '-1');
    expect(within(blank).getByRole('button', { name: 'Jupiter' })).toHaveAttribute(
      'aria-roledescription',
      'draggable',
    );
  });

  it('is a named group and no tab stop while disabled', () => {
    renderBlank({ disabled: true });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Blank 2' })).toHaveAttribute('tabindex', '-1');
  });

  it('keeps its name while focused once a keyboard placement fills it', () => {
    const { rerender } = renderBlank({ selectedItem: { id: 'c1', fromChoice: true } });
    screen.getByRole('button', { name: 'Blank 2' }).focus();

    rerender(tree({ choice: { id: 'c1', value: 'Jupiter' } }));

    expect(screen.getByRole('group', { name: 'Blank 2' })).toHaveFocus();
  });

  it('places the selection with Enter, Space or a click', () => {
    const onPlacementClick = vi.fn();
    renderBlank({ selectedItem: { id: 'c1', fromChoice: true }, onPlacementClick });
    const blank = screen.getByRole('button', { name: 'Blank 2' });

    fireEvent.keyDown(blank, { code: 'Enter' });
    fireEvent.keyDown(blank, { code: 'Space' });
    fireEvent.click(blank);

    expect(onPlacementClick).toHaveBeenCalledTimes(3);
    expect(onPlacementClick).toHaveBeenCalledWith('1');
  });

  describe('receptiveness while a drag is live', () => {
    const Source = () => {
      const { setNodeRef, attributes, listeners } = useDraggable({ id: 'source' });
      return (
        <button ref={setNodeRef} {...attributes} {...listeners}>
          source
        </button>
      );
    };

    const startDrag = (extras?: any) => {
      render(
        <ThemeProvider theme={theme}>
          <DndContext>
            <Source />
            <Blank id="0" instanceId="dib" onChange={vi.fn()} {...extras} />
          </DndContext>
        </ThemeProvider>,
      );
      const source = screen.getByRole('button', { name: 'source' });
      source.focus();
      fireEvent.keyDown(source, { code: 'Space' });
    };

    // The drag sets a selection (see DragInTheBlank.handleDragStart), and rectIntersection picks
    // the drop target from the overlay's rect, not the pointer — so a blank under the pointer
    // is not necessarily the one dnd-kit will drop into.
    it('does not turn receptive just because the pointer is over it', async () => {
      startDrag({ selectedItem: { id: 'source', fromChoice: true } });
      const blank = await screen.findByRole('button', { name: 'Blank 1' });

      fireEvent.mouseEnter(blank);

      expect(blank.querySelector('.parentOver')).toBeNull();
    });

    it('still turns receptive on hover when a choice was selected by click', () => {
      renderBlank({ selectedItem: { id: 'c1', fromChoice: true } });
      const blank = screen.getByRole('button', { name: 'Blank 2' });

      fireEvent.mouseEnter(blank);

      expect(blank.querySelector('.parentOver')).not.toBeNull();
    });
  });
});
