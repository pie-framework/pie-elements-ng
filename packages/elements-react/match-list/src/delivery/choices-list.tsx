// @ts-nocheck
/**
 * @synced-from pie-elements/packages/match-list/src/choices-list.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { find, isEmpty, isUndefined } from 'lodash-es';
import DragAndDropAnswer from './answer.js';
import { DroppablePlaceholder } from './droppable-placeholder.js';

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
  };

  render() {
    const { model, disabled, session, instanceId, onRemoveAnswer } = this.props;
    const { config } = model;
    const { duplicates } = config;

    const filteredAnswers = config.answers
      .filter(
        (answer) =>
          duplicates ||
          isEmpty(session) ||
          !session.value ||
          isUndefined(find(session.value, (val) => val === answer.id)),
      )
      .map((answer) => (
        <DragAndDropAnswer
          key={answer.id}
          instanceId={instanceId}
          draggable={true}
          disabled={disabled}
          session={session}
          type="choice"
          {...answer}
        />
      ));

    return (
      <ChoicesContainer>
        <DroppablePlaceholder id="choices-pool" disabled={disabled} onRemoveAnswer={onRemoveAnswer}>
          {filteredAnswers}
        </DroppablePlaceholder>
      </ChoicesContainer>
    );
  }
}

export default ChoicesList;
