import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { useDraggable } from '@dnd-kit/core';

import { ANNOUNCEMENT_CLEAR_MS, LiveAnnouncer, nextAnnouncement } from '../live-announcer';
import { DragProvider } from '../drag-provider';
import { draggableAttributes } from '../draggable-attributes';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  vi.useRealTimers();
});

const region = (container: HTMLElement) => container.querySelector('[role="status"]') as HTMLElement;

describe('LiveAnnouncer', () => {
  it('says a message and empties itself after ANNOUNCEMENT_CLEAR_MS', () => {
    const { container } = render(<LiveAnnouncer announcement={nextAnnouncement(undefined, 'Placed Lemon.')} />);

    expect(region(container)).toHaveAttribute('aria-live', 'assertive');
    expect(region(container)).toHaveAttribute('aria-atomic', 'true');
    // MathJax leaves it alone: a message is words
    expect(region(container)).toHaveClass('mathjax_ignore');
    expect(region(container)).toHaveTextContent('Placed Lemon.');

    act(() => {
      vi.advanceTimersByTime(ANNOUNCEMENT_CLEAR_MS - 1);
    });
    expect(region(container)).toHaveTextContent('Placed Lemon.');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(region(container).textContent).toBe('');
  });

  it('says the same words again as a new node', () => {
    const first = nextAnnouncement(undefined, 'Selected Lemon.');
    const { container, rerender } = render(<LiveAnnouncer announcement={first} />);
    const firstNode = region(container).firstChild;

    rerender(<LiveAnnouncer announcement={nextAnnouncement(first, 'Selected Lemon.')} />);

    expect(region(container)).toHaveTextContent('Selected Lemon.');
    expect(region(container).firstChild).not.toBe(firstNode);
  });

  it('gives a message that follows quickly its own full time', () => {
    const first = nextAnnouncement(undefined, 'Selected Lemon.');
    const { container, rerender } = render(<LiveAnnouncer announcement={first} />);

    act(() => {
      vi.advanceTimersByTime(ANNOUNCEMENT_CLEAR_MS - 10);
    });
    rerender(<LiveAnnouncer announcement={nextAnnouncement(first, 'Placed Lemon.')} />);
    act(() => {
      vi.advanceTimersByTime(ANNOUNCEMENT_CLEAR_MS - 1);
    });

    expect(region(container)).toHaveTextContent('Placed Lemon.');
  });

  it('keeps an empty region when there is nothing to say', () => {
    const { container } = render(<LiveAnnouncer politeness="polite" />);

    expect(region(container)).toHaveAttribute('aria-live', 'polite');
    expect(region(container).textContent).toBe('');
  });
});

describe('draggableAttributes', () => {
  it("keeps dnd-kit's attributes but the role description, and marks the draggable", () => {
    const attributes = {
      role: 'button',
      tabIndex: 0,
      'aria-disabled': false,
      'aria-pressed': undefined,
      'aria-roledescription': 'draggable',
      'aria-describedby': 'drag-instructions-1',
    };

    expect(draggableAttributes(attributes)).toEqual({
      role: 'button',
      tabIndex: 0,
      'aria-disabled': false,
      'aria-pressed': undefined,
      'aria-describedby': 'drag-instructions-1',
      'data-dnd-draggable': '',
    });
  });
});

const Tile = ({ id }: { id: string }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });

  return (
    <div ref={setNodeRef} {...listeners} {...draggableAttributes(attributes)}>
      {id}
    </div>
  );
};

describe('DragProvider announcements', () => {
  const pickUp = (container: HTMLElement) => {
    const tile = container.querySelector('[data-dnd-draggable]') as HTMLElement;

    tile.focus();
    act(() => {
      fireEvent.keyDown(tile, { code: 'Space', key: ' ' });
    });
  };
  // The provider's region comes after its children; dnd-kit's own is the `DndLiveRegion` one.
  const regions = (container: HTMLElement) => {
    const all = [...container.querySelectorAll('[role="status"]')] as HTMLElement[];

    return {
      provider: all.find((node) => !node.id.startsWith('DndLiveRegion')) as HTMLElement,
      dndKit: all.find((node) => node.id.startsWith('DndLiveRegion')) as HTMLElement,
    };
  };

  it("says an element's announcement in its own region, which empties itself, and leaves dnd-kit's empty", () => {
    const announcements = {
      onDragStart: ({ active }: { active: { id: string | number } }) => `Selected answer choice ${active.id}.`,
      onDragOver: () => undefined,
      onDragEnd: () => undefined,
      onDragCancel: () => undefined,
    };
    const { container } = render(
      <DragProvider accessibility={{ announcements }}>
        <Tile id="Lemon" />
      </DragProvider>,
    );

    pickUp(container);

    const { provider, dndKit } = regions(container);
    expect(provider).toHaveTextContent('Selected answer choice Lemon.');
    expect(dndKit.textContent).toBe('');

    act(() => {
      vi.advanceTimersByTime(ANNOUNCEMENT_CLEAR_MS);
    });
    expect(provider.textContent).toBe('');
  });

  it("says dnd-kit's default announcements the same way when an element gives none", () => {
    const { container } = render(
      <DragProvider>
        <Tile id="choice-1" />
      </DragProvider>,
    );

    pickUp(container);

    const { provider, dndKit } = regions(container);
    expect(provider).toHaveTextContent('Picked up draggable item choice-1.');
    expect(dndKit.textContent).toBe('');
  });

  it('leaves the draggable without a role description', () => {
    const { container } = render(
      <DragProvider>
        <Tile id="choice-1" />
      </DragProvider>,
    );

    const tile = container.querySelector('[data-dnd-draggable]') as HTMLElement;
    expect(tile).toHaveAttribute('role', 'button');
    expect(tile).not.toHaveAttribute('aria-roledescription');
  });
});
