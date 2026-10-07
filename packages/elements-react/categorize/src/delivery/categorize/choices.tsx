// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { uid } from '@pie-lib/drag';
import Choice, { ChoiceType } from './choice.js';
import DroppablePlaceholder from './droppable-placeholder.js';
import { sanitizeModelHtml } from '@pie-element/shared-utils';
export { ChoiceType };

const Wrapper: any = styled('div')({
  flex: 1,
  touchAction: 'none',
});

const LabelHolder: any = styled('div')(({ theme }) => ({
  margin: '0 auto',
  textAlign: 'center',
  paddingTop: theme.spacing(1),
}));

export class Choices extends React.Component {
  static propTypes = {
    choices: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.shape(ChoiceType), PropTypes.shape({ empty: PropTypes.bool })]),
    ),
    model: PropTypes.shape({
      categoriesPerRow: PropTypes.number,
      choicesLabel: PropTypes.string,
    }),
    disabled: PropTypes.bool,
    choicePosition: PropTypes.string,
    onDropChoice: PropTypes.func,
    onRemoveChoice: PropTypes.func,
    correct: PropTypes.boolean,
    selectedItem: PropTypes.object,
    onSelectClick: PropTypes.func,
    onPlacementClick: PropTypes.func,
    uid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  static defaultProps = {
    model: {
      categoriesPerRow: 1,
      choicesLabel: '',
    },
  };

  render() {
    const {
      choices = [],
      model,
      disabled,
      onDropChoice,
      onRemoveChoice,
      choicePosition,
      correct,
      selectedItem,
      onSelectClick,
      onPlacementClick,
      uid: instanceId,
    } = this.props;
    const hasLabel = !!model.choicesLabel && model.choicesLabel !== '';
    const labelId = hasLabel ? `categorize-${instanceId}-choices-label` : undefined;

    let style = {
      textAlign: 'center',
    };

    if (choicePosition === 'left') {
      style.direction = 'rtl';
    }

    return (
      <Wrapper>
        <DroppablePlaceholder
          id="choices-board"
          labelId={labelId}
          onDropChoice={onDropChoice}
          onRemoveChoice={onRemoveChoice}
          disabled={disabled}
          style={{ background: 'none' }}
          choiceBoard={true}
          correct={correct}
          selectedItem={selectedItem}
          onPlacementClick={onPlacementClick}
        >
          {hasLabel && <LabelHolder id={labelId} dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(model.choicesLabel) }} />}
          {choices.map((c, index) => {
            return c.empty ? (
              <div key={index} />
            ) : (
              <Choice
                disabled={disabled}
                key={index}
                extraStyle={{ maxWidth: `${95 / model.categoriesPerRow}%` }}
                selectedItem={selectedItem}
                onSelectClick={onSelectClick}
                {...c}
              />
            );
          })}
        </DroppablePlaceholder>
      </Wrapper>
    );
  }
}

export default uid.withUid(Choices);
