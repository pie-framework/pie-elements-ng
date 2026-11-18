// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import DragAndDropAnswer from './answer.js';
import { DroppablePlaceholder } from './droppable-placeholder.js';
import { availableAnswers, describeAvailableChoices, describeChoiceTile } from './announcements.js';
import { visuallyHidden } from './visually-hidden.js';

const ChoicesContainer: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export class ChoicesList extends React.Component {
  static propTypes = {
    session: PropTypes.object.isRequired,
    instanceId: PropTypes.string.isRequired,
    model: PropTypes.object.isRequired,
    disabled: PropTypes.bool.isRequired,
    onRemoveAnswer: PropTypes.func,
    selectedAnswer: PropTypes.object,
    onChoiceClick: PropTypes.func,
    onPlacementClick: PropTypes.func,
    t: PropTypes.func.isRequired,
  };

  render() {
    const {
      model,
      disabled,
      session,
      instanceId,
      onRemoveAnswer,
      selectedAnswer,
      onChoiceClick,
      onPlacementClick,
      t,
    } = this.props;
    const { config } = model;

    const filteredAnswers = availableAnswers(config, session.value || {}).map((answer) => (
        <DragAndDropAnswer
          key={answer.id}
          instanceId={instanceId}
          draggable={true}
          disabled={disabled}
          session={session}
          type="choice"
          selectedAnswer={selectedAnswer}
          onSelectClick={onChoiceClick}
          ariaLabel={describeChoiceTile(t, config, answer.id)}
          {...answer}
        />
      ));

    // Only a live interaction has choices left to move to.
    const available = disabled ? null : describeAvailableChoices(t, config, session.value || {});

    return (
      <ChoicesContainer>
        {available && (
          <div style={visuallyHidden}>{[available.count, ...available.choices, available.end].join(' ')}</div>
        )}
        <DroppablePlaceholder
          id="choices-pool"
          disabled={disabled}
          onRemoveAnswer={onRemoveAnswer}
          onPlacementClick={onPlacementClick}
        >
          {filteredAnswers}
        </DroppablePlaceholder>
      </ChoicesContainer>
    );
  }
}

export default ChoicesList;
