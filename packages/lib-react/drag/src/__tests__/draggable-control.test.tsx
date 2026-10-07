import React from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';

import { useDraggableControl } from '../draggable-control';
import type { DraggableControlOptions } from '../draggable-control';

const Tile = ({ children, ...options }: Partial<DraggableControlOptions> & { children: ReactNode }) => {
  const { setNodeRef, controlProps } = useDraggableControl({ id: 'tile', ...options });

  return (
    <div ref={setNodeRef} data-testid="tile" {...controlProps}>
      {children}
    </div>
  );
};

const ToolButton = ({ disabled }: { disabled: boolean }) => {
  const { setNodeRef, controlProps } = useDraggableControl({ id: 'tool', disabled });

  return (
    <div ref={setNodeRef}>
      <button type="button" {...controlProps}>
        Point
      </button>
    </div>
  );
};

const renderInContext = (ui: ReactNode, onDragStart = vi.fn()) =>
  render(<DndContext onDragStart={onDragStart}>{ui}</DndContext>);

describe('useDraggableControl', () => {
  it('makes an enabled draggable one named tab stop with drag instructions', () => {
    renderInContext(<Tile label="Antigone">A tile</Tile>);

    const tile = screen.getByRole('button', { name: 'Antigone' });
    expect(tile).toHaveAttribute('tabindex', '0');
    expect(tile).toHaveAttribute('aria-roledescription', 'draggable');
    const instructions = document.getElementById(tile.getAttribute('aria-describedby') as string);
    expect(instructions?.textContent).toMatch(/pick up/i);
  });

  it('names an enabled draggable by the element it is labelled by', () => {
    renderInContext(
      <>
        <span id="tile-label">Creon</span>
        <Tile labelledBy="tile-label">A tile</Tile>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Creon' })).toHaveAttribute('aria-labelledby', 'tile-label');
  });

  it('renames a content-named draggable when its content changes after the render', async () => {
    const contentName = (content: HTMLElement) => content.textContent?.trim() || undefined;
    renderInContext(
      <Tile contentName={contentName}>
        <span data-testid="slot" />
      </Tile>,
    );
    expect(screen.getByTestId('tile')).not.toHaveAttribute('aria-label');

    await act(async () => {
      screen.getByTestId('slot').textContent = 'typeset';
    });

    expect(screen.getByRole('button', { name: 'typeset' })).toBe(screen.getByTestId('tile'));
  });

  it('leaves an unlabelled draggable named by its content', () => {
    renderInContext(
      <Tile>
        <p>Antigone buries her brother</p>
      </Tile>,
    );

    const tile = screen.getByRole('button', { name: 'Antigone buries her brother' });
    expect(tile).not.toHaveAttribute('aria-label');
  });

  it('names an unlabelled draggable through its content namer', () => {
    const contentName = vi.fn((content: HTMLElement) =>
      content.querySelector('sup') ? 'x squared' : undefined,
    );
    renderInContext(
      <Tile contentName={contentName}>
        x<sup>2</sup>
      </Tile>,
    );

    expect(screen.getByRole('button', { name: 'x squared' })).toBe(screen.getByTestId('tile'));
    expect(contentName).toHaveBeenCalledWith(screen.getByTestId('tile'));
  });

  it('prefers an explicit name over the content namer', () => {
    const contentName = vi.fn(() => 'from content');
    renderInContext(
      <Tile label="Antigone" contentName={contentName}>
        A tile
      </Tile>,
    );

    expect(screen.getByRole('button', { name: 'Antigone' })).toBeInTheDocument();
    expect(contentName).not.toHaveBeenCalled();
  });

  it('starts a keyboard drag from the control', () => {
    const onDragStart = vi.fn();
    renderInContext(<Tile label="Antigone">A tile</Tile>, onDragStart);

    fireEvent.keyDown(screen.getByRole('button', { name: 'Antigone' }), { code: 'Space' });

    expect(onDragStart).toHaveBeenCalledWith(
      expect.objectContaining({ active: expect.objectContaining({ id: 'tile' }) }),
    );
  });

  it('leaves a disabled draggable plain content, with no role, tab stop, name or listeners', () => {
    const onDragStart = vi.fn();
    const contentName = vi.fn(() => 'from content');
    renderInContext(
      <Tile disabled label="Antigone" contentName={contentName}>
        A tile
      </Tile>,
      onDragStart,
    );

    const tile = screen.getByTestId('tile');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const semantics = ['role', 'tabindex', 'aria-label', 'aria-roledescription', 'aria-describedby', 'aria-disabled'];
    for (const attribute of semantics) {
      expect(tile).not.toHaveAttribute(attribute);
    }
    expect(tile).toHaveTextContent('A tile');
    expect(contentName).not.toHaveBeenCalled();

    fireEvent.keyDown(tile, { code: 'Space' });
    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('leaves a native button its own role, tab stop and name while dragging is disabled', () => {
    renderInContext(<ToolButton disabled />);

    const button = screen.getByRole('button', { name: 'Point' });
    expect(button).not.toHaveAttribute('tabindex');
    expect(button).not.toHaveAttribute('aria-roledescription');
    expect(button).not.toHaveAttribute('aria-disabled');
  });

  it('makes a native button the draggable while dragging is enabled', () => {
    renderInContext(<ToolButton disabled={false} />);

    const button = screen.getByRole('button', { name: 'Point' });
    expect(button).toHaveAttribute('aria-roledescription', 'draggable');
    expect(button.parentElement).not.toHaveAttribute('role');
    expect(button.parentElement).not.toHaveAttribute('tabindex');
  });
});
