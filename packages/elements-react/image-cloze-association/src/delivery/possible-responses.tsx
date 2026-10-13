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

  return (
    <BaseContainer style={customStyle} onClick={handlePoolClick}>
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
