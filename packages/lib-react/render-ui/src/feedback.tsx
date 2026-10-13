// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { sanitizeModelHtml } from '@pie-element/shared-utils';
import * as color from './color.js';

const FeedbackContainer: any = styled('div')({
  transformOrigin: '0% 0px 0px',
  width: '100%',
  display: 'block',
  overflow: 'hidden',
  '&.incorrect': {
    color: '#946202',
  },
});

// The page's ink on tinted status surfaces: the theming contract holds --pie-text to 4.5:1 on
// --pie-background-dark and --pie-incorrect-secondary, and --pie-correct-secondary clears it in
// every shipped scheme. White on the saturated status fills stays below 4.5:1.
const FeedbackContent: any = styled('div')({
  WebkitFontSmoothing: 'antialiased',
  backgroundColor: `var(--feedback-bg-color, ${color.backgroundDark()})`,
  borderRadius: '4px',
  lineHeight: '25px',
  margin: '0px',
  padding: '10px',
  verticalAlign: 'middle',
  color: `var(--feedback-color, ${color.text()})`,
  '&.correct': {
    backgroundColor: `var(--feedback-correct-bg-color, ${color.correctSecondary()})`,
  },
  '&.incorrect': {
    backgroundColor: `var(--feedback-incorrect-bg-color, ${color.incorrectSecondary()})`,
  },
});

const TransitionWrapper: any = styled('div')({
  '&.feedback-enter': {
    height: '1px',
  },
  '&.feedback-enter-active': {
    height: '45px',
    transition: 'height 500ms',
  },
  '&.feedback-exit': {
    height: '45px',
  },
  '&.feedback-exit-active': {
    height: '1px',
    transition: 'height 200ms',
  },
});

export class Feedback extends React.Component {
  static propTypes = {
    correctness: PropTypes.string,
    feedback: PropTypes.string,
  };

  nodeRef = React.createRef();

  renderFeedback() {
    const { correctness, feedback } = this.props;

    if (!correctness || !feedback) return null;

    return (
      <CSSTransition key="hasFeedback" nodeRef={this.nodeRef} timeout={{ enter: 500, exit: 200 }} classNames="feedback">
        <TransitionWrapper ref={this.nodeRef}>
          <FeedbackContainer>
            {/* An alert is announced when inserted with its text, which is how feedback mounts on evaluate; a status region would have to be on the page beforehand. */}
            <FeedbackContent
              role="alert"
              className={correctness}
              dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(feedback) }}
            />
          </FeedbackContainer>
        </TransitionWrapper>
      </CSSTransition>
    );
  }

  render() {
    return (
      <div>
        <TransitionGroup>{this.renderFeedback()}</TransitionGroup>
      </div>
    );
  }
}

export default Feedback;
