// @ts-nocheck

import { Correct, Incorrect, NothingSubmitted, PartiallyCorrect, ShowRationale } from '@pie-lib/icons';
import PropTypes from 'prop-types';
import { color } from '@pie-lib/render-ui';

import React, { useRef } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { styled } from '@mui/material/styles';
import { sanitizeModelHtml } from '@pie-element/shared-utils';

let getIcon = (t) => {
  switch (t) {
    case 'unanswered':
      return NothingSubmitted;
    case 'correct':
      return Correct;
    case 'incorrect':
      return Incorrect;
    case 'partial':
      return PartiallyCorrect;
    case 'info':
      return ShowRationale;
    default:
      return undefined;
  }
};

// Tinted status surfaces under the inherited page ink, the same pairs render-ui's Feedback uses.
const FeedbackContainer: any = styled('div')(({ $type }) => ({
  marginTop: '10px',
  backgroundColor: color.backgroundDark(),
  padding: '10px',
  display: 'flex',
  alignItems: 'center',
  ...($type === 'correct' && {
    backgroundColor: color.correctSecondary(),
  }),
  ...($type === 'incorrect' && {
    backgroundColor: color.incorrectSecondary(),
  }),
  '& svg': {
    height: '30px',
  },
  '& h1': {
    padding: '0px',
    margin: '0px',
  },
}));

const Message: any = styled('span')({
  paddingLeft: '5px',
  userSelect: 'none',
});

const Feedback = (props) => {
  const { type, width, message } = props;
  let Icon = getIcon(type);
  const nodeRef = useRef(null);

  return (
    <TransitionGroup>
      <CSSTransition classNames={'fb'} key="fb" timeout={300} nodeRef={nodeRef}>
        <FeedbackContainer ref={nodeRef} key="panel" $type={type} style={{ width }}>
          <Icon iconSet="emoji" shape="square" />
          <Message dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(message) }} />
        </FeedbackContainer>
      </CSSTransition>
    </TransitionGroup>
  );
};

Feedback.propTypes = {
  width: PropTypes.number,
  message: PropTypes.string,
  type: PropTypes.string,
};

export default Feedback;
