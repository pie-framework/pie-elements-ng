import React from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';

import { useDraggableControl } from '../draggable-control';
import { useDropTarget } from '../drop-target';
import type { DropTargetOptions } from '../drop-target';

const Target = ({ children, ...options }: Partial<DropTargetOptions> & { children?: ReactNode }) => {
  const { setNodeRef, targetProps } = useDropTarget({ id: 'target', ...options });

  return (
    <div ref={setNodeRef} data-testid="target" {...targetProps}>
      {children}
    </div>
  );
};

const Choice = ({ label }: { label: string }) => {
  const { setNodeRef, controlProps } = useDraggableControl({ id: label, label });

  return <div ref={setNodeRef} {...controlProps} />;
};

const renderInContext = (ui: ReactNode) => render(<DndContext>{ui}</DndContext>);

describe('useDropTarget', () => {
  it('is a named group without a tab stop when it takes no placement', () => {
    renderInContext(<Target label="Response area 1 of 3" />);

    expect(screen.getByRole('group', { name: 'Response area 1 of 3' })).toHaveAttribute('tabindex', '-1');
  });

  it('names the target by the element it is labelled by', () => {
    renderInContext(
      <>
        <span id="category-label">Rational</span>
        <Target labelledBy="category-label" />
      </>,
    );

    expect(screen.getByRole('group', { name: 'Rational' })).toHaveAttribute('aria-labelledby', 'category-label');
  });

  it('is a named button tab stop that places on Enter or Space while it holds no choices', () => {
    const onPlace = vi.fn();
    renderInContext(<Target label="Blank 1" onPlace={onPlace} />);

    const target = screen.getByRole('button', { name: 'Blank 1' });
    expect(target).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(target, { code: 'Enter' });
    fireEvent.keyDown(target, { code: 'Space' });
    fireEvent.keyDown(target, { code: 'KeyA' });
    expect(onPlace).toHaveBeenCalledTimes(2);
  });

  it('stays a group tab stop around the choices it holds, which keep their own role and name', () => {
    const onPlace = vi.fn();
    renderInContext(
      <Target label="Rational" onPlace={onPlace} holdsChoices>
        <Choice label="One half" />
      </Target>,
    );

    const target = screen.getByRole('group', { name: 'Rational' });
    expect(target).toHaveAttribute('tabindex', '0');
    const choice = within(target).getByRole('button', { name: 'One half' });

    fireEvent.keyDown(choice, { code: 'Enter' });
    expect(onPlace).not.toHaveBeenCalled();

    fireEvent.keyDown(target, { code: 'Enter' });
    expect(onPlace).toHaveBeenCalledTimes(1);
  });

  it('takes no tab stop and no placement while disabled', () => {
    const onPlace = vi.fn();
    renderInContext(<Target label="Blank 1" onPlace={onPlace} disabled />);

    const target = screen.getByRole('group', { name: 'Blank 1' });
    expect(target).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(target, { code: 'Enter' });
    expect(onPlace).not.toHaveBeenCalled();
  });
});
