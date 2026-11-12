// @ts-nocheck

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDroppable } from '@dnd-kit/core';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';
import cx from 'clsx';

import PossibleResponse from './possible-response.js';

const AnswersContainer: any = styled('div')(() => ({
  display: 'flex',
  flexWrap: 'wrap',
}));

const ResponseContainer: any = styled('div')(() => ({
  position: 'absolute',
  boxSizing: 'border-box',
  '&.active': {
    border: `2px solid ${color.text()}`,
    backgroundColor: 'rgba(230, 242, 252, .8)',
  },
  '&.dashed': {
    border: `2px dashed ${color.text()}`,
  },
  '&.is-over': {
    border: '1px solid rgb(158, 158, 158)',
    backgroundColor: 'rgb(224, 224, 224)',
  },
}));

const ImageDropTarget = ({
  answers,
  canDrag,
  containerStyle,
  draggingElement,
  getChoiceLabel,
  onDragAnswerBegin,
  onDragAnswerEnd,
  showDashedBorder,
  responseAreaFill,
  responseContainerPadding = '10px',
  imageDropTargetPadding,
  answerChoiceTransparency,
  maxResponsePerZone,
  onDrop,
  index,
  label,
  selectedResponse,
  onSelectClick,
  onPlacementClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldHaveSmallPadding, setShouldHaveSmallPadding] = useState(false);
  const dropContainerRef = useRef(null);
  const dropContainerResponsesHeightRef = useRef(null);

  const { setNodeRef, isOver } = useDroppable({
    id: `response-container-${index}`,
    data: {
      containerIndex: index,
      onDrop,
    },
  });

  useEffect(() => {
    const container = dropContainerRef.current;

    if (!container) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const isDraggingElement = !!draggingElement.id;
  const hasSelection = !!selectedResponse;
  const showsHoverEffect = isOver || (hasSelection && isHovered && canDrag);

  const containerClasses = cx({
    'is-over': showsHoverEffect,
    dashed: showDashedBorder && !isDraggingElement,
    active: isDraggingElement,
  });

  const updatedContainerStyle = {
    padding: maxResponsePerZone === 1 ? '0' : responseContainerPadding,
    ...containerStyle,
    ...(responseAreaFill && !isDraggingElement && { backgroundColor: responseAreaFill }),
    cursor: hasSelection && canDrag ? 'pointer' : undefined,
  };

  const handleContainerClick = () => {
    if (!canDrag) return;

    if (selectedResponse) {
      onPlacementClick?.(index);
    }

    // Empty background clicked with nothing selected: nothing to place.
  };

  // A response area only takes a click or a key while a choice is selected, so only then is it a
  // tab stop, whether it holds answers or not. With nothing selected the tab path runs through the
  // choices instead (see possible-response.tsx), in the pool or in an area.
  const isNativeTabStop = hasSelection && canDrag;
  // A button only while it is a tab stop and holds no answer: a button's children are
  // presentational to assistive technology, so an area holding answers is a group. Named in
  // every state: a keyboard placement turns the focused button into a group, and focus stays on it.
  const role = isNativeTabStop && answers.length === 0 ? 'button' : 'group';

  const handleContainerKeyDown = (e) => {
    // Only a key pressed on the area itself. A keyboard drag keeps focus on the dragged answer, so
    // the Space or Enter that drops it fires there and bubbles up through the area it came from,
    // which would otherwise take it as "place the selection here" and cancel the drop.
    if (e.target !== e.currentTarget) return;

    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      handleContainerClick();
    }
  };

  return (
    <ResponseContainer
      ref={(ref) => {
        dropContainerRef.current = ref;
        setNodeRef(ref);
      }}
      className={containerClasses}
      style={updatedContainerStyle}
      role={role}
      aria-label={label}
      tabIndex={isNativeTabStop ? 0 : -1}
      onClick={handleContainerClick}
      onKeyDown={isNativeTabStop ? handleContainerKeyDown : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {answers.length ? (
        <AnswersContainer
          ref={(ref) => {
            dropContainerResponsesHeightRef.current = ref?.getBoundingClientRect().height;
          }}
        >
          {answers.map((answer) => (
            <PossibleResponse
              key={answer.id}
              data={answer}
              canDrag={canDrag}
              getChoiceLabel={getChoiceLabel}
              onDragBegin={() => onDragAnswerBegin(answer)}
              onDragEnd={onDragAnswerEnd}
              answerChoiceTransparency={answerChoiceTransparency}
              containerStyle={{
                padding: imageDropTargetPadding ? imageDropTargetPadding : shouldHaveSmallPadding ? '2px' : '6px 10px',
              }}
              selectedResponse={selectedResponse}
              onSelectClick={onSelectClick}
              onPlacementClick={onPlacementClick}
            />
          ))}
        </AnswersContainer>
      ) : null}
    </ResponseContainer>
  );
};

ImageDropTarget.propTypes = {
  answer: PropTypes.object,
  answers: PropTypes.array,
  canDrag: PropTypes.bool.isRequired,
  containerStyle: PropTypes.object.isRequired,
  draggingElement: PropTypes.object.isRequired,
  getChoiceLabel: PropTypes.func,
  onDragAnswerBegin: PropTypes.func.isRequired,
  onDragAnswerEnd: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  showDashedBorder: PropTypes.bool,
  responseAreaFill: PropTypes.string,
  answerChoiceTransparency: PropTypes.bool,
  responseContainerPadding: PropTypes.string,
  imageDropTargetPadding: PropTypes.string,
  maxResponsePerZone: PropTypes.number,
  label: PropTypes.string,
  selectedResponse: PropTypes.object,
  onSelectClick: PropTypes.func,
  onPlacementClick: PropTypes.func,
};

export default ImageDropTarget;
