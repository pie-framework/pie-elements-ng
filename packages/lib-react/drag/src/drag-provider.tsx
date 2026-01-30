// @ts-nocheck
/**
 * @synced-from pie-lib/packages/drag/src/drag-provider.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';

export function DragProvider({ children, onDragEnd, onDragStart, collisionDetection, modifiers, autoScroll }) {
  const [activeId, setActiveId] = useState(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 }}),
    useSensor(KeyboardSensor)
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

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={collisionDetection}
      modifiers={modifiers}
      autoScroll={autoScroll}
    >
      {children}
    </DndContext>
  );
}

DragProvider.propTypes = {
  children: PropTypes.node.isRequired,
  onDragEnd: PropTypes.func,
  onDragStart: PropTypes.func,
  collisionDetection: PropTypes.func,
  modifiers: PropTypes.arrayOf(PropTypes.func),
  autoScroll: PropTypes.object,
};

export default DragProvider;