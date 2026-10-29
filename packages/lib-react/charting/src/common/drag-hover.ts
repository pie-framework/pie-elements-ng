import React from 'react';

// Only one mark can be dragged at a time. While one is, it keeps its hover effect and every other
// mark ignores the pointer, so the rollover marks the thing that is actually moving.
let active: DragHover | null = null;
const trackers = new Set<DragHover>();

/**
 * The hover of one mark. It knows whether the pointer is over the mark and whether the mark is being
 * dragged, and reports `hovered` through `onChange` whenever that changes. It is the one place the rule
 * lives, for function components (`useDragHover`) and class components alike:
 *   - a dragged mark is hovered wherever the pointer is
 *   - no other mark is hovered while one is dragged
 *   - when the drag ends, every mark the pointer is over is hovered again, the dragged one included
 */
export class DragHover {
  hovered = false;

  private inside = false;

  private dragging = false;

  private alive = false;

  constructor(private onChange: (hovered: boolean) => void) {}

  /** Starts listening for other marks' drags. Call it once the mark is mounted. */
  attach() {
    this.alive = true;
    trackers.add(this);
  }

  /** Stops listening, and ends the drag if the mark is unmounted in the middle of one. */
  dispose() {
    this.stop();
    this.alive = false;
    trackers.delete(this);
  }

  /** Whether the pointer is over the mark. Keep it current while dragging: the drop reads it. */
  setInside(inside: boolean) {
    this.inside = inside;
    this.update();
  }

  start() {
    if (this.dragging) {
      return;
    }

    this.dragging = true;
    active = this;
    refreshAll();
  }

  stop() {
    if (!this.dragging) {
      return;
    }

    this.dragging = false;

    if (active === this) {
      active = null;
    }

    refreshAll();
  }

  update() {
    const hovered = this.dragging || (this.inside && (active === null || active === this));

    if (this.alive && hovered !== this.hovered) {
      this.hovered = hovered;
      this.onChange(hovered);
    }
  }
}

const refreshAll = () => trackers.forEach((tracker) => tracker.update());

/**
 * Hover state for a function-component mark. `isDragging` is the flag gridDraggable passes to the mark
 * it wraps; pass false for a mark that cannot be dragged, so pressing it does not count as a drag.
 */
export const useDragHover = (isDragging: boolean) => {
  const [hovered, setHovered] = React.useState(false);
  const ref = React.useRef<DragHover | null>(null);

  if (!ref.current) {
    ref.current = new DragHover(setHovered);
  }

  const tracker = ref.current;

  React.useEffect(() => {
    tracker.attach();

    return () => tracker.dispose();
  }, [tracker]);

  React.useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    tracker.start();

    return () => tracker.stop();
  }, [isDragging, tracker]);

  return {
    // a dragged mark is hovered from the render that starts the drag, not the one after its effect
    hovered: isDragging || hovered,
    onEnter: () => tracker.setInside(true),
    onLeave: () => tracker.setInside(false),
  };
};
