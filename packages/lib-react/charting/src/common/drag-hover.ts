import React from 'react';

// Only one handle can be dragged at a time. While one is, it keeps its hover effect and every
// other handle ignores the pointer, so the rollover marks the thing that is actually moving.
let active: object | null = null;

export const beginDrag = (owner: object) => {
  active = owner;
};

export const endDrag = (owner: object) => {
  if (active === owner) {
    active = null;
  }
};

export const hoverBlocked = (owner: object) => active !== null && active !== owner;

/**
 * Hover state for a function-component handle. `isDragging` is the flag gridDraggable already
 * passes to the handle it wraps.
 */
export const useDragHover = (isDragging: boolean) => {
  const owner = React.useRef({}).current;
  const inside = React.useRef(false);
  const [over, setOver] = React.useState(false);

  React.useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    beginDrag(owner);

    return () => {
      endDrag(owner);
      // the pointer may have left (or stayed) while the handle was being dragged
      setOver(inside.current);
    };
  }, [isDragging, owner]);

  const onEnter = () => {
    inside.current = true;

    if (!isDragging && !hoverBlocked(owner)) {
      setOver(true);
    }
  };

  const onLeave = () => {
    inside.current = false;

    if (!isDragging) {
      setOver(false);
    }
  };

  return { hovered: isDragging || over, onEnter, onLeave };
};
