// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';
import { ICADroppablePlaceholder } from '@pie-lib/drag';

import PossibleResponse from './possible-response.js';

const BaseContainer: any = styled('div')(({ theme }) => ({
  backgroundColor: color.background(),
  margin: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  width: 'fit-content',
}));

const PossibleResponses = ({
  canDrag,
  data,
  getChoiceLabel,
  onDragBegin,
  answerChoiceTransparency,
  customStyle,
  isVertical,
  minHeight,
  selectedResponse,
  onSelectClick,
  onPlacementClick,
}) => {
  const handlePoolClick = () => {
    if (!canDrag) return;

    if (selectedResponse) {
      // `undefined` containerIndex means "the pool" — root.jsx's placeSelectedResponse
      // routes it to handleOnAnswerRemove.
      onPlacementClick?.(undefined);
    }
  };

  // The pool takes a selection back, so while a choice is selected it is a tab stop beside the
  // response areas, and Space or Enter on it returns the selection, as a click does.
  const isNativeTabStop = !!selectedResponse && canDrag;

  const handlePoolKeyDown = (e) => {
    // Only a key pressed on the pool itself, not one bubbling up from a choice in it: a keyboard
    // drag keeps focus on the dragged choice, so the key that drops it fires there.
    if (e.target !== e.currentTarget) return;

    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      handlePoolClick();
    }
  };

  return (
    <BaseContainer
      style={customStyle}
      role="group"
      tabIndex={isNativeTabStop ? 0 : -1}
      onClick={handlePoolClick}
      onKeyDown={isNativeTabStop ? handlePoolKeyDown : undefined}
    >
      <ICADroppablePlaceholder id="ica-board" disabled={!canDrag} isVerticalPool={isVertical} minHeight={minHeight}>
        {(data || []).map((item) => (
          <PossibleResponse
            canDrag={canDrag}
            key={item.id}
            data={item}
            getChoiceLabel={getChoiceLabel}
            onDragBegin={onDragBegin}
            answerChoiceTransparency={answerChoiceTransparency}
            containerStyle={{ margin: '4px' }}
            selectedResponse={selectedResponse}
            onSelectClick={onSelectClick}
            onPlacementClick={onPlacementClick}
          />
        ))}
      </ICADroppablePlaceholder>
    </BaseContainer>
  );
};

PossibleResponses.propTypes = {
  canDrag: PropTypes.bool.isRequired,
  data: PropTypes.array.isRequired,
  getChoiceLabel: PropTypes.func,
  onDragBegin: PropTypes.func.isRequired,
  answerChoiceTransparency: PropTypes.bool,
  customStyle: PropTypes.object,
  isVertical: PropTypes.bool,
  minHeight: PropTypes.number,
  selectedResponse: PropTypes.object,
  onSelectClick: PropTypes.func,
  onPlacementClick: PropTypes.func,
};

export default PossibleResponses;
