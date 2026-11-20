import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DndContext, useDraggable } from '@dnd-kit/core';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// MathJax loads off a CDN and has no bearing on the blank's semantics.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Blank } = await import('../blank');

const theme = createTheme();
const FILLED = 'Blank 2 contains the answer choice Jupiter end of answer choice';

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

    expect(screen.getByRole('button', { name: 'Blank 2 is empty' })).toHaveAttribute('tabindex', '0');
  });

  it('lays out the named target as the chip box, so it is at least 24px tall', () => {
    renderBlank();

    // An inline span measures one text line (18px); an inline-flex box wraps its 32px chip.
    expect(getComputedStyle(screen.getByRole('button', { name: 'Blank 2 is empty' })).display).toBe('inline-flex');
  });

  it('sits on the middle of the line, so a filled blank and an empty one share a row height', () => {
    renderBlank();

    expect(getComputedStyle(screen.getByRole('button', { name: 'Blank 2 is empty' })).verticalAlign).toBe('middle');
  });

  it('keeps the line height it inherits, as the legacy blank did', () => {
    renderBlank();

    expect(getComputedStyle(screen.getByRole('button', { name: 'Blank 2 is empty' })).lineHeight).toBe('normal');
  });

  it('names an empty blank in the item language', async () => {
    renderBlank({ language: 'es_ES' });

    expect(await screen.findByRole('button', { name: 'El espacio en blanco 2 está vacío' })).toBeInTheDocument();
  });

  it('is a named group that leaves its tab stop to the answer it holds', () => {
    renderBlank({ choice: { id: 'c1', value: 'Jupiter' } });

    const blank = screen.getByRole('group', { name: FILLED });
    expect(blank).toHaveAttribute('tabindex', '-1');
    expect(within(blank).getByRole('button', { name: 'Answer choice: Jupiter in blank 2' })).toBeInTheDocument();
  });

  it('names the answer choice it holds, and not "draggable", when it takes focus', () => {
    renderBlank({ choice: { id: 'c1', value: '<p>Jupiter</p>' } });

    const tile = screen.getByRole('button', { name: 'Answer choice: Jupiter in blank 2' });
    expect(tile).not.toHaveAttribute('aria-roledescription');
    expect(tile).toHaveAttribute('aria-describedby');
  });

  it('leaves an answer with an image or math to name itself, under the blank\'s plain name', () => {
    renderBlank({ choice: { id: 'c1', value: '<img src="a.png" alt="a planet">' } });

    expect(screen.getByRole('group', { name: 'Blank 2' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Answer choice:/ })).not.toBeInTheDocument();
  });

  it('is a named group and no tab stop while disabled', () => {
    renderBlank({ disabled: true });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Blank 2 is empty' })).toHaveAttribute('tabindex', '-1');
  });

  it('keeps its name while focused once a keyboard placement fills it', () => {
    const { rerender } = renderBlank({ selectedItem: { id: 'c1', fromChoice: true } });
    screen.getByRole('button', { name: 'Blank 2 is empty' }).focus();

    rerender(tree({ choice: { id: 'c1', value: 'Jupiter' } }));

    expect(screen.getByRole('group', { name: FILLED })).toHaveFocus();
  });

  it('places the selection with Enter, Space or a click', () => {
    const onPlacementClick = vi.fn();
    renderBlank({ selectedItem: { id: 'c1', fromChoice: true }, onPlacementClick });
    const blank = screen.getByRole('button', { name: 'Blank 2 is empty' });

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
      const blank = await screen.findByRole('button', { name: 'Blank 1 is empty' });

      fireEvent.mouseEnter(blank);

      expect(blank.querySelector('.parentOver')).toBeNull();
    });

    it('still turns receptive on hover when a choice was selected by click', () => {
      renderBlank({ selectedItem: { id: 'c1', fromChoice: true } });
      const blank = screen.getByRole('button', { name: 'Blank 2 is empty' });

      fireEvent.mouseEnter(blank);

      expect(blank.querySelector('.parentOver')).not.toBeNull();
    });
  });
});
