// @ts-nocheck

import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'clsx';
import { styled } from '@mui/material/styles';
import { useDraggable } from '@dnd-kit/core';
import { color, useMathName } from '@pie-lib/render-ui';

import EvaluationIcon from './evaluation-icon.js';
import StaticHTMLSpan from './static-html-span.js';

const BaseContainer: any = styled('div')(() => ({
  position: 'relative',
  // --pie-white stays white under a dark theme; white keeps the tile opaque when no theme is set.
  backgroundColor: color.v('pie')('background', color.defaults.WHITE),
  color: color.text(),
  border: `1px solid ${color.borderDark()}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '28px',
  // A 24px target (WCAG 2.5.8) also while an image choice is still loading.
  minWidth: '24px',
  width: 'fit-content',
  '& span img': {
    // Added for touch devices, for image content.
    // This will prevent the context menu from appearing and not allowing other interactions with the image.
    // If interactions with the image in the token will be requested we should handle only the context Menu.
    pointerEvents: 'none',
  },
  '&.textAnswerChoiceStyle': {
    padding: '0 10px',
    margin: '4px 6px !important',
  },
  '&.answerChoiceTransparency': {
    border: 'none',
    backgroundColor: `${color.transparent()}`,
    '&:hover': {
      border: `1px solid ${color.borderDark()}`,
    },
  },
  '&.baseCorrect': {
    border: `2px solid ${color.correct()} !important`,
  },
  '&.baseIncorrect': {
    border: `2px solid ${color.incorrect()} !important`,
  },
  '&.selected': {
    border: `2px solid ${color.buttonFocusOutline()}`,
    // Dimming lives on the direct children, not here, so the selection border above
    // stays fully opaque even while the tile content dims.
    '& > *': {
      opacity: 0.7,
    },
  },
}));

const StyledSpan: any = styled(StaticHTMLSpan)(() => ({
  cursor: 'grab',
  backgroundColor: color.background(),
  '&.hiddenSpan': {
    visibility: 'hidden',
  },
}));

// Text, or an image with an `alt`, names the tile; an image with an empty `alt` leaves it unnamed.
const hasTextAlternative = (html) => {
  const content = new DOMParser().parseFromString(html || '', 'text/html').body;

  return !!content.textContent.trim() || [...content.querySelectorAll('img')].some((img) => img.alt.trim());
};

const PossibleResponse = ({
  canDrag,
  containerStyle,
  data,
  getChoiceLabel,
  onDragBegin,
  answerChoiceTransparency,
  isOverlay,
  selectedResponse,
  onSelectClick,
  onPlacementClick,
}) => {
  const rootRef = useRef(null);
  const label = useMemo(
    () => (hasTextAlternative(data.value) ? undefined : getChoiceLabel?.(data.value)),
    [data.value, getChoiceLabel],
  );
  const longPressTimer = useRef(null);
  // Chrome leaves MathML out of a button's name from content, so a math response names itself.
  const mathName = useMathName(rootRef);

  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `possible-response-${data.id}`,
    data: {
      id: data.id,
      value: data.value,
      containerIndex: data.containerIndex,
    },
    disabled: !canDrag,
  });

  const isSelected =
    !!selectedResponse && selectedResponse.id === data.id && selectedResponse.containerIndex === data.containerIndex;

  const handleClick = (e) => {
    if (!canDrag) return;

    e.stopPropagation();

    const isPlaced = data.containerIndex !== undefined;

    if (isSelected) {
      // Clicking the already-selected tile again deselects it.
      onSelectClick?.(data);
    } else if (selectedResponse && isPlaced) {
      // Something else is selected, and this tile is already inside a container:
      // place the selection into that same container (a swap/insert, handled by the
      // existing handleOnAnswerSelect logic).
      onPlacementClick?.(data.containerIndex);
    } else {
      // Nothing selected yet, or this is a pool item (pool items are never placement
      // targets — the pool itself, in possible-responses.jsx, is): select this tile.
      onSelectClick?.(data);
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleTouchMove = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    longPressTimer.current = setTimeout(() => {
      if (canDrag && rootRef.current) {
        onDragBegin(data);
      }
    }, 500); // start drag after 500ms (touch and hold duration) for chromebooks and other touch devices
  };

  useEffect(() => {
    const node = rootRef.current;

    if (!node) return;

    node.addEventListener('touchstart', handleTouchStart, { passive: false });
    node.addEventListener('touchend', handleTouchEnd);
    node.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchend', handleTouchEnd);
      node.removeEventListener('touchmove', handleTouchMove);
    };
  }, [canDrag, data]);

  const { isCorrect } = data || {};
  const evaluationStyle = {
    fontSize: 14,
    position: 'absolute',
    bottom: '3px',
    right: '3px',
  };
  const correctnessClass = isCorrect === true ? 'baseCorrect' : isCorrect === false ? 'baseIncorrect' : undefined;

  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const containsImage = imgRegex.test(data.value);

  const containerClassNames = classNames({
    answerChoiceTransparency: answerChoiceTransparency && !isDragging,
    [correctnessClass]: !!correctnessClass,
    textAnswerChoiceStyle: !containsImage && !isOverlay,
    selected: isSelected && !isDragging,
  });

  const promptClassNames = classNames({ hiddenSpan: data.hidden });

  return (
    <BaseContainer
      className={containerClassNames}
      style={containerStyle}
      ref={(ref) => {
        rootRef.current = ref;
        setNodeRef(ref);
      }}
      onClick={handleClick}
      aria-label={label ?? mathName}
      {...listeners}
      {...attributes}
    >
      <StyledSpan html={data.value} className={promptClassNames} />
      <EvaluationIcon isCorrect={data.isCorrect} containerStyle={evaluationStyle} />
    </BaseContainer>
  );
};

PossibleResponse.propTypes = {
  canDrag: PropTypes.bool.isRequired,
  containerStyle: PropTypes.object,
  data: PropTypes.object.isRequired,
  getChoiceLabel: PropTypes.func,
  onDragBegin: PropTypes.func.isRequired,
  answerChoiceTransparency: PropTypes.bool,
  isOverlay: PropTypes.bool,
  selectedResponse: PropTypes.object,
  onSelectClick: PropTypes.func,
  onPlacementClick: PropTypes.func,
};

PossibleResponse.defaultProps = {
  containerStyle: {},
  answerChoiceTransparency: false,
  isOverlay: false,
  selectedResponse: null,
};

export default PossibleResponse;
