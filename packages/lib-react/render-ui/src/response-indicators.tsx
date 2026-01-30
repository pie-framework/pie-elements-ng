// @ts-nocheck
/**
 * @synced-from pie-lib/packages/render-ui/src/response-indicators.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import * as icons from '@pie-lib/icons';
import Popover from '@mui/material/Popover';
import { styled } from '@mui/material/styles';
import Feedback from './feedback';
import debug from 'debug';

const log = debug('pie-libs:render-ui:response-indicators');

const ResponseIndicatorContainer: any = styled('div')(({ hasFeedback }) => ({
  cursor: hasFeedback ? 'pointer' : 'default',
}));

const StyledPopover: any = styled(Popover)({
  cursor: 'pointer',
});

const PopoverPaper: any = styled('div')({
  padding: '0',
  borderRadius: '4px',
});

const BuildIndicator = (Icon, correctness) => {
  class Indicator extends React.Component {
    constructor(props) {
      super(props);
      this.state = {};
    }

    handlePopoverOpen: any = (event) => {
      log('[handlePopoverOpen]', event.target);
      this.setState({ anchorEl: event.target });
    };

    handlePopoverClose: any = () => {
      this.setState({ anchorEl: null });
    };

    render() {
      const { feedback } = this.props;
      const { anchorEl } = this.state;
      return (
        <ResponseIndicatorContainer hasFeedback={!!feedback}>
          <span ref={(r) => (this.icon = r)} onClick={this.handlePopoverOpen}>
            <Icon />
          </span>

          {feedback && (
            <StyledPopover
              PaperComponent={PopoverPaper}
              open={!!anchorEl}
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              onClose={this.handlePopoverClose}
            >
              <Feedback feedback={feedback} correctness={correctness} />
            </StyledPopover>
          )}
        </ResponseIndicatorContainer>
      );
    }
  }

  Indicator.propTypes = {
    feedback: PropTypes.string,
  };

  return Indicator;
};

export const Correct = BuildIndicator(icons.Correct, 'correct');
export const Incorrect = BuildIndicator(icons.Incorrect, 'incorrect');
export const PartiallyCorrect = BuildIndicator(icons.PartiallyCorrect, 'partially-correct');
export const NothingSubmitted = BuildIndicator(icons.NothingSubmitted, 'nothing-submitted');
