// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/src/categorize/choice.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import debug from 'debug';
import { styled } from '@mui/material/styles';
import { useDraggable } from '@dnd-kit/core';
import { uid } from '@pie-lib/drag';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { color } from '@pie-lib/render-ui';

const log = debug('@pie-ui:categorize:choice');

export const ChoiceType = {
  content: PropTypes.string.isRequired,
  id: PropTypes.string,
};

const ChoiceContainer: any = styled('div', {
  shouldForwardProp: (prop) => !['isDragging', 'disabled', 'correct', 'isSelected'].includes(prop),
})(({ isDragging, disabled, correct, isSelected }) => ({
  direction: 'initial',
  cursor: disabled ? 'not-allowed' : isDragging ? 'move' : 'pointer',
  width: '100%',
  borderRadius: '6px',
  ...(isSelected && {
    border: `solid 2px ${color.buttonFocusOutline()}`,
  }),
  ...(correct === true && {
    border: `solid 2px ${color.correct()}`,
  }),
  ...(correct === false && {
    border: `solid 2px ${color.incorrect()}`,
  }),
}));

const StyledCard: any = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})(({ isSelected }) => ({
  color: color.text(),
  backgroundColor: color.background(),
  width: '100%',
  opacity: isSelected ? 0.5 : 1,
}));

const StyledCardContent: any = styled(CardContent)(({ theme }) => ({
  color: color.text(),
  backgroundColor: color.white(),
  '&:last-child': {
    paddingBottom: theme.spacing(2),
  },
  borderRadius: '4px',
  border: '1px solid',
  '& p': {
    margin: '0px',
  },
}));

export class Layout extends React.Component {
  static propTypes = {
    ...ChoiceType,
    disabled: PropTypes.bool,
    correct: PropTypes.bool,
    isDragging: PropTypes.bool,
    isSelected: PropTypes.bool,
  };
  static defaultProps = {};
  render() {
    const { content, isDragging, disabled, correct, isSelected, showsSelectionBorder } = this.props;

    return (
      <ChoiceContainer
        isDragging={isDragging}
        disabled={disabled}
        correct={correct}
        isSelected={isSelected}
      >
        <StyledCard isSelected={isSelected}>
          <StyledCardContent dangerouslySetInnerHTML={{ __html: content }} />
        </StyledCard>
      </ChoiceContainer>
    );
  }
}

const DraggableChoice = ({
  id,
  content,
  disabled,
  correct,
  extraStyle,
  categoryId,
  choiceIndex,
  selectedItem,
  onSelectClick,
}) => {
  // Generate unique draggable ID for each instance
  // If in choices board (categoryId is undefined), use 'board' suffix
  // If in a category, include categoryId and choiceIndex to make it unique
  const draggableId = categoryId !== undefined ? `choice-${id}-${categoryId}-${choiceIndex}` : `choice-${id}-board`;

  // Built once and reused for both dnd-kit's own data and the click handler below, so a
  // click carries exactly the same shape dnd-kit's onDragStart/onDragEnd would.
  const dragData = {
    id,
    categoryId,
    choiceIndex,
    value: content,
    itemType: 'categorize',
    type: 'choice',
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableId,
    data: dragData,
    disabled,
  });

  const isSelected =
    !!selectedItem &&
    selectedItem.id === id &&
    selectedItem.categoryId === categoryId &&
    selectedItem.choiceIndex === choiceIndex;

  const handleClick = (e) => {
    if (disabled) return;

    if (isSelected) {
      // Clicking the already-selected choice again deselects it.
      e.stopPropagation();
      onSelectClick?.(dragData);
      return;
    }

    if (selectedItem && categoryId !== undefined) {
      // A different item is selected and this choice sits inside a category. Let the click
      // bubble to the enclosing category droppable, which places the selection into that
      // category — identical to clicking the category's background. Handling it here would
      // duplicate that placement routing.
      return;
    }

    // Nothing selected, or this is a pool choice (pool choices are never placement
    // targets): select it for moving.
    e.stopPropagation();
    onSelectClick?.(dragData);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ margin: '4px', ...extraStyle }}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <Layout
        id={id}
        content={content}
        disabled={disabled}
        correct={correct}
        isDragging={isDragging}
        isSelected={isSelected}
      />
    </div>
  );
};

DraggableChoice.propTypes = {
  ...ChoiceType,
  extraStyle: PropTypes.object,
  categoryId: PropTypes.string,
  choiceIndex: PropTypes.number,
  onRemoveChoice: PropTypes.func,
  selectedItem: PropTypes.object,
  onSelectClick: PropTypes.func,
};

export default uid.withUid(DraggableChoice);
