// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/feedback-config/index.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import FeedbackSelector, { FeedbackType } from './feedback-selector';
import PropTypes from 'prop-types';
import React from 'react';
import { styled } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { merge } from 'lodash-es';

export { FeedbackSelector };

const StyledFeedbackContainer: any = styled('div')(() => ({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
}));

const StyledAccordionDetails: any = styled(AccordionDetails)(() => ({
  paddingTop: 0,
  paddingBottom: 0,
}));

export const buildDefaults = (input) => {
  return merge(
    {},
    {
      correct: { type: 'default', default: 'Correct' },
      incorrect: { type: 'default', default: 'Incorrect' },
      partial: { type: 'default', default: 'Nearly' },
    },
    input,
  );
};

export class FeedbackConfig extends React.Component {
  static propTypes = {
    allowPartial: PropTypes.bool,
    className: PropTypes.string,
    feedback: PropTypes.shape({
      correct: PropTypes.shape(FeedbackType),
      incorrect: PropTypes.shape(FeedbackType),
      partial: PropTypes.shape(FeedbackType),
    }),
    onChange: PropTypes.func.isRequired,
    toolbarOpts: PropTypes.object,
  };

  static defaultProps = {
    allowPartial: true,
    feedback: buildDefaults(),
  };

  onChange(key, config) {
    const { feedback, onChange } = this.props;
    const update = { ...feedback, [key]: config };

    onChange(update);
  }

  onCorrectChange = this.onChange.bind(this, 'correct');

  onIncorrectChange = this.onChange.bind(this, 'incorrect');

  onPartialChange = this.onChange.bind(this, 'partial');

  render() {
    const { className, allowPartial, feedback, toolbarOpts } = this.props;

    return (
      <div className={className}>
        <Accordion slotProps={{ transition: { timeout: { enter: 225, exit: 195 } } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Feedback</Typography>
          </AccordionSummary>

          <StyledAccordionDetails>
            <StyledFeedbackContainer>
              <FeedbackSelector
                label="If correct, show"
                feedback={feedback.correct}
                onChange={this.onCorrectChange}
                toolbarOpts={toolbarOpts}
              />

              {allowPartial && (
                <FeedbackSelector
                  label="If partially correct, show"
                  feedback={feedback.partial}
                  onChange={this.onPartialChange}
                  toolbarOpts={toolbarOpts}
                />
              )}

              <FeedbackSelector
                label="If incorrect, show"
                feedback={feedback.incorrect}
                onChange={this.onIncorrectChange}
                toolbarOpts={toolbarOpts}
              />
            </StyledFeedbackContainer>
          </StyledAccordionDetails>
        </Accordion>
      </div>
    );
  }
}

export default FeedbackConfig;
