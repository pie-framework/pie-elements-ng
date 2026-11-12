// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';

import EvaluationIcon from './evaluation-icon.js';

// The main image is never shrunk to fit (its drop targets are pixel offsets against its
// native size), so when the image plus the possible responses don't fit the available width
// (e.g. under browser zoom) the whole section - image, responses and border - scrolls
// horizontally as one. Scrolling only the image would leave the responses pool overflowing,
// and keeping the whole section in one scroll box lets placed answers be dragged back to the pool.
// The top padding (instead of a margin on the bordered box) keeps the evaluation icon, which
// sits 14px above the border, inside the scroll box's padding area so it isn't clipped.
const ScrollContainer: any = styled('div')(({ theme }) => ({
  paddingTop: theme.spacing(2),
  maxWidth: '100%',
  overflowX: 'auto',
}));

const StyledContainer: any = styled('div')(() => ({
  display: 'flex',
  width: 'fit-content',
  '&.default': {
    border: `1px solid ${color.disabled()}`,
  },
  '&.correct': {
    border: `2px solid ${color.correct()}`,
  },
  '&.incorrect': {
    border: `2px solid ${color.incorrect()}`,
  },
}));

class InteractiveSection extends React.Component {
  getClassname() {
    const { responseCorrect } = this.props;
    let styleProp;

    switch (responseCorrect) {
      case undefined:
        styleProp = 'default';
        break;
      case true:
        styleProp = 'correct';
        break;
      default:
        styleProp = 'incorrect';
        break;
    }
    return styleProp;
  }

  getPositionDirection(choicePosition) {
    return choicePosition === 'left' || choicePosition === 'right' ? 'row' : 'column';
  }

  // The possible responses come first in the DOM when they show first, above or left of the image,
  // rather than being moved there by a reversed flex direction: the tab path and the reading order
  // follow the DOM, so they then follow what is on screen. The whole row is reversed, as the
  // reversed direction did, so the evaluation icon and the warning keep their places too.
  showsResponsesFirst(choicePosition) {
    return choicePosition === 'left' || choicePosition === 'top';
  }

  render() {
    const { children, responseCorrect, uiStyle } = this.props;
    const classname = this.getClassname();
    const { possibilityListPosition = 'bottom' } = uiStyle || {};
    const style = { flexDirection: this.getPositionDirection(possibilityListPosition) };
    const evaluationStyle = {
      display: 'flex',
      margin: '0 auto',
      marginTop: -14,
    };
    const items = React.Children.toArray([
      <EvaluationIcon key="evaluation" containerStyle={evaluationStyle} filled isCorrect={responseCorrect} />,
      children,
    ]);

    return (
      <ScrollContainer>
        <StyledContainer className={classname} style={style}>
          {this.showsResponsesFirst(possibilityListPosition) ? items.reverse() : items}
        </StyledContainer>
      </ScrollContainer>
    );
  }
}

InteractiveSection.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]).isRequired,
  responseCorrect: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  uiStyle: PropTypes.object,
};

InteractiveSection.defaultProps = {
  responseCorrect: undefined,
};

export default InteractiveSection;
