// @ts-nocheck
/**
 * @synced-from pie-lib/packages/drag/src/droppable-placeholder.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PlaceHolder from './placeholder.js';
import PropTypes from 'prop-types';
import { useDroppable } from '@dnd-kit/core';

const preventInteractionStyle = {
  flex: 1,
};

export function DroppablePlaceholder({ id, children, disabled, classes, isVerticalPool, minHeight }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled,
  });

  return (
    <div ref={setNodeRef} style={preventInteractionStyle}>
      <PlaceHolder
        disabled={disabled}
        isOver={isOver}
        choiceBoard={true}
        className={classes}
        isVerticalPool={isVerticalPool}
        minHeight={minHeight}
      >
        {children}
      </PlaceHolder>
    </div>
  );
}

DroppablePlaceholder.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  disabled: PropTypes.bool,
  classes: PropTypes.object,
  isVerticalPool: PropTypes.bool,
  minHeight: PropTypes.number,
};

export default DroppablePlaceholder;
