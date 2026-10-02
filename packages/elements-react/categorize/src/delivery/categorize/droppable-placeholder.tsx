// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/src/categorize/droppable-placeholder.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import debug from 'debug';
import { useTheme } from '@mui/material/styles';
import { useDroppable } from '@dnd-kit/core';
import { PlaceHolder } from '@pie-lib/drag';
import { color } from '@pie-lib/render-ui';

const log = debug('@pie-ui:categorize:droppable-placeholder');

const DroppablePlaceholder = ({
  children,
  grid,
  disabled,
  choiceBoard,
  minRowHeight,
  id,
  correct,
  selectedItem,
  onPlacementClick,
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      itemType: 'categorize',
      categoryId: id,
    },
    disabled,
  });

  const hasSelection = !!selectedItem;
  // dnd-kit's own isOver only reflects real collision detection during an active drag, so
  // it stays false while a choice is merely click-selected. Track hovering locally and fold
  // it into the same isOver signal PlaceHolder already consumes, so hovering a drop target
  // while something is selected gets the exact same treatment as hovering it mid-drag —
  // one visual code path, no duplicated styling.
  const showsHoverEffect = isOver || (hasSelection && isHovered && !disabled);

  // A category is always a valid drop target (it holds 0..N choices), so it is always a
  // tab stop unless disabled — that's what makes "select a choice, Tab to a category,
  // press Enter" work. The choices inside it keep their own dnd-kit tab stops for pick-up.
  const isNativeTabStop = !disabled;

  const handleClick = () => {
    if (disabled || !selectedItem) return;

    onPlacementClick?.(id);
  };

  const handleKeyDown = (e) => {
    // Only react to a keydown that originated directly on this droppable container, not one
    // that bubbled up from a descendant (e.g. a Choice card placed inside a category, or any
    // choice inside the pool). A real dnd-kit keyboard drag never moves DOM focus off the
    // choice being dragged, so Tab-cycling to a different target and pressing Enter to drop
    // still fires the keydown on the original (still-focused) choice node, which bubbles
    // through React's synthetic event system up to this ancestor's onKeyDown before dnd-kit's
    // own document-level listener sees it. Without this guard, that bubbled Enter would be
    // misread as "place the current selection into ME" (the choice's own origin container)
    // and would synchronously cancel the real drag via placeSelectedItem's synthetic Escape,
    // short-circuiting the drop before dnd-kit ever processes the keypress.
    if (e.target !== e.currentTarget) return;

    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  const extraStyles = {
    padding: theme.spacing(0.5),
    borderRadius: theme.spacing(0.5),
    gridColumnGap: 0,
    gridRowGap: 0,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'flex-start',
    width: '100%',
    height: '100%',
    ...(correct === false &&
      !choiceBoard && {
        border: `solid 2px ${color.incorrect()}`,
      }),
    ...(correct === true &&
      !choiceBoard && {
        border: `solid 2px ${color.correct()}`,
      }),
  };

  return (
    <div
      ref={setNodeRef}
      role={isNativeTabStop ? 'button' : undefined}
      tabIndex={isNativeTabStop ? 0 : -1}
      onClick={handleClick}
      onKeyDown={isNativeTabStop ? handleKeyDown : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        flex: 1,
        minHeight: minRowHeight || '80px',
        position: 'relative',
        touchAction: 'none',
        // Only a pointer while there is actually something to place here. `cursor` only
        // manifests on hover anyway, so this needs no separate :hover rule.
        ...(hasSelection && !disabled && { cursor: 'pointer' }),
      }}
    >
      <PlaceHolder
        isOver={showsHoverEffect}
        grid={grid}
        disabled={disabled}
        choiceBoard={choiceBoard}
        isCategorize
        extraStyles={extraStyles}
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
  id: PropTypes.string.isRequired,
  correct: PropTypes.bool,
  selectedItem: PropTypes.object,
  onPlacementClick: PropTypes.func,
};

export default DroppablePlaceholder;
