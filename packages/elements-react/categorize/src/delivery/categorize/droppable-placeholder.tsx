// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/src/categorize/droppable-placeholder.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import debug from 'debug';
import { useDroppable } from '@dnd-kit/core';
import { PlaceHolder } from '@pie-lib/drag';

const log = debug('@pie-ui:categorize:droppable-placeholder');

const DroppablePlaceholder = ({
  children,
  grid,
  disabled,
  choiceBoard,
  minRowHeight,
  id
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      itemType: 'categorize',
      categoryId: id
    },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minHeight: minRowHeight || '80px',
        position: 'relative'
      }}
    >
      <PlaceHolder
        isOver={isOver}
        grid={grid}
        disabled={disabled}
        choiceBoard={choiceBoard}
        isCategorize
      >
        {children}
      </PlaceHolder>
    </div>
  );
};

DroppablePlaceholder.propTypes = {
  choiceBoard: PropTypes.bool,
  children: PropTypes.node.isRequired,
  grid: PropTypes.object,
  disabled: PropTypes.bool,
  minRowHeight: PropTypes.string,
  onDropChoice: PropTypes.func,
  id: PropTypes.string.isRequired
};

export default DroppablePlaceholder;
