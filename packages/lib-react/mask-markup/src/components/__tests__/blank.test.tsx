import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// MathJax loads off a CDN and has no bearing on the blank's semantics.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Blank } = await import('../blank');

const theme = createTheme();

const renderBlank = (extras?: any) =>
  render(
    <ThemeProvider theme={theme}>
      <DndContext>
        <p>
          The <Blank id="1" instanceId="dib" onChange={vi.fn()} {...extras} /> is the largest planet.
        </p>
      </DndContext>
    </ThemeProvider>,
  );

describe('Blank', () => {
  it('names an empty blank by its position', () => {
    renderBlank();

    expect(screen.getByRole('button', { name: 'Blank 2' })).toHaveAttribute('tabindex', '0');
  });

  it('names an empty blank in the item language', () => {
    renderBlank({ language: 'es_ES' });

    expect(screen.getByRole('button', { name: 'Espacio en blanco 2' })).toBeInTheDocument();
  });

  it('leaves a filled blank to the answer it holds', () => {
    renderBlank({ choice: { id: 'c1', value: 'Jupiter' } });

    expect(screen.queryByRole('button', { name: 'Blank 2' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jupiter' })).toHaveAttribute('aria-roledescription', 'draggable');
  });

  it('is no tab stop while disabled', () => {
    renderBlank({ disabled: true });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
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
});
