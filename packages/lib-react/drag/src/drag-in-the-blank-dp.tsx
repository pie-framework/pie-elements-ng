// @ts-nocheck
/**
 * @synced-from pie-lib/packages/drag/src/drag-in-the-blank-dp.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import PlaceHolder from './placeholder';
import { useDroppable } from '@dnd-kit/core';
import { styled } from '@mui/material/styles';

// With @dnd-kit, the drop logic is handled in the DragProvider's onDragEnd callback
// This component now just wraps DroppablePlaceholder with drag-in-the-blank specific logic

const DroppablePlaceholderContainer: any = styled('div')({
  minHeight: '100px',
});

export function DragInTheBlankDroppable({
  children,
  disabled,
  classes,
  isVerticalPool,
  minHeight,
  instanceId,
  ...rest
}) {
  // The actual drop handling will be managed by the parent component
  // through the DragProvider's onDragEnd callback
  const { setNodeRef, isOver } = useDroppable({
     id: 'drag-in-the-blank-droppable',
    data: {
      type: 'MaskBlank',
      accepts: ['MaskBlank'],
      id: 'drag-in-the-blank-droppable',
      toChoiceBoard: true,
      instanceId
    }
  });

  return (
    <div ref={setNodeRef} >
      <DroppablePlaceholderContainer>
        <PlaceHolder
          isOver={isOver}
          choiceBoard={true}
          className={classes}
          isVerticalPool={isVerticalPool}
          extraStyles={{
            width: '100%',
            minHeight: minHeight || 100,
            height: 'auto',
          }}
        >
          {children}
        </PlaceHolder>
      </DroppablePlaceholderContainer>
    </div>
  );
}

DragInTheBlankDroppable.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  onDrop: PropTypes.func,
  instanceId: PropTypes.string,
};

export default DragInTheBlankDroppable;
