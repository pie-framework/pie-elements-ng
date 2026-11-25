// @ts-nocheck

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { DndContext, KeyboardSensor, PointerSensor, defaultAnnouncements, useSensor, useSensors } from '@dnd-kit/core';
import { useUniqueId } from '@pie-lib/render-ui';
import { LiveAnnouncer, nextAnnouncement } from './live-announcer.js';

/**
 * dnd-kit's announcement callbacks, each handing its message to `announce` and none to dnd-kit. dnd-kit
 * changes its own live region only on a drag event, so it could never be emptied after a message; the
 * provider's `LiveAnnouncer` says the same messages and empties itself.
 */
export const routeAnnouncements = (announcements, announce) => {
  const route = (callback) => (event) => {
    announce(callback?.(event));

    return undefined;
  };

  return {
    onDragStart: route(announcements.onDragStart),
    // dnd-kit calls this one on every pointer move, and only when it is given
    ...(announcements.onDragMove && { onDragMove: route(announcements.onDragMove) }),
    onDragOver: route(announcements.onDragOver),
    onDragEnd: route(announcements.onDragEnd),
    onDragCancel: route(announcements.onDragCancel),
  };
};

export function DragProvider({
  children,
  onDragEnd,
  onDragStart,
  onDragCancel,
  collisionDetection,
  modifiers,
  autoScroll,
  keyboardCoordinateGetter,
  keyboardCodes,
  accessibility,
}) {
  const [activeId, setActiveId] = useState(null);
  const [announcement, setAnnouncement] = useState();
  // dnd-kit numbers the drag instructions each draggable references from a counter that
  // restarts in every element bundle, so two element versions on a page would share the id.
  const dragInstructionsId = useUniqueId('drag-instructions');

  // Only build a keyboard sensor options object when a consumer actually customizes
  // it, so consumers that don't pass these props get dnd-kit's own defaults exactly
  // as before (arrow-key nudging, Tab ends the drag, etc.).
  const keyboardSensorOptions =
    keyboardCoordinateGetter || keyboardCodes ? { coordinateGetter: keyboardCoordinateGetter, keyboardCodes } : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, keyboardSensorOptions),
  );

  const announce = useCallback((text) => {
    if (text) {
      setAnnouncement((previous) => nextAnnouncement(previous, text));
    }
  }, []);
  const announcements = accessibility?.announcements ?? defaultAnnouncements;
  const routedAccessibility = useMemo(
    () => ({ ...accessibility, announcements: routeAnnouncements(announcements, announce) }),
    [accessibility, announcements, announce],
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    if (onDragStart) {
      onDragStart(event);
    }
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    if (onDragEnd) {
      onDragEnd(event);
    }
  };

  const handleDragCancel = (event) => {
    setActiveId(null);
    if (onDragCancel) {
      onDragCancel(event);
    }
  };

  return (
    <DndContext
      id={dragInstructionsId}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      collisionDetection={collisionDetection}
      modifiers={modifiers}
      autoScroll={autoScroll}
      accessibility={routedAccessibility}
    >
      {children}
      <LiveAnnouncer id={`${dragInstructionsId}-announcer`} announcement={announcement} />
    </DndContext>
  );
}

DragProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onDragEnd: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragCancel: PropTypes.func,
  collisionDetection: PropTypes.func,
  modifiers: PropTypes.arrayOf(PropTypes.func),
  autoScroll: PropTypes.object,
  // Custom dnd-kit KeyboardSensor coordinateGetter (e.g. for Tab/Shift+Tab-based placement).
  // Omit to keep dnd-kit's default keyboard-dragging behavior.
  keyboardCoordinateGetter: PropTypes.func,
  // Overrides for dnd-kit's KeyboardSensor keyboardCodes (start/cancel/end).
  // Omit to keep dnd-kit's defaults.
  keyboardCodes: PropTypes.shape({
    start: PropTypes.arrayOf(PropTypes.string),
    cancel: PropTypes.arrayOf(PropTypes.string),
    end: PropTypes.arrayOf(PropTypes.string),
  }),
  // Passed through to dnd-kit's DndContext (screenReaderInstructions, announcements, container).
  // The announcements, or dnd-kit's defaults when there are none, are said by the provider's own
  // live region, which empties itself after each message; dnd-kit's region is left empty.
  accessibility: PropTypes.object,
};

export default DragProvider;
