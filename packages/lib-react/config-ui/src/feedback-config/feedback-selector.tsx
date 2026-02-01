// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/feedback-config/feedback-selector.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

//import EditableHTML from '@pie-lib/editable-html-tip-tap';
import { InputContainer } from '@pie-lib/render-ui';
import PropTypes from 'prop-types';
import React from 'react';
import { styled } from '@mui/material/styles';
import Group from './group';

// Lazy load EditableHtml to avoid SSR issues with mathquill
const EditableHtmlLazy = React.lazy(() =>
  import('@pie-lib/editable-html-tip-tap').then(module => ({ default: module.default }))
);

const StyledEditableHTML: any = styled(EditableHtmlLazy)(({ theme }) => ({
    fontFamily: theme.typography.fontFamily,
  }));

const feedbackLabels = {
  default: 'Simple Feedback',
  none: 'No Feedback',
  custom: 'Customized Feedback',
};

const StyledFeedbackSelector: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledInputContainer: any = styled(InputContainer)(() => ({
  paddingBottom: 0,
}));

const StyledCustomHolder: any = styled('div')(({ theme }) => ({
  marginTop: '0px',
  background: theme.palette.grey[300],
  padding: 0,
  marginBottom: theme.spacing(2),
  borderRadius: '4px',
}));

const StyledDefaultHolder: any = styled('div')(({ theme }) => ({
  marginTop: '0px',
  background: theme.palette.grey[300],
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: '4px',
  fontFamily: theme.typography.fontFamily,
  cursor: 'default',
}));

const StyledGroup: any = styled(Group)(({ theme }) => ({
  paddingTop: theme.spacing(1),
}));

export const FeedbackType = {
  type: PropTypes.oneOf(['default', 'custom', 'none']),
  default: PropTypes.string,
  custom: PropTypes.string,
};

export class FeedbackSelector extends React.Component {
  static propTypes = {
    keys: PropTypes.arrayOf(PropTypes.string),
    label: PropTypes.string.isRequired,
    feedback: PropTypes.shape(FeedbackType).isRequired,
    onChange: PropTypes.func.isRequired,
    toolbarOpts: PropTypes.object,
    mathMlOptions: PropTypes.object,
  };

  changeType: any = (type) => {
    const { onChange, feedback } = this.props;

    onChange({ ...feedback, type });
  };

  changeCustom: any = (custom) => {
    const { onChange, feedback } = this.props;

    onChange({ ...feedback, type: 'custom', custom });
  };

  render() {
    const { keys, label, feedback, toolbarOpts, mathMlOptions = {} } = this.props;

    const feedbackKeys = keys || Object.keys(feedbackLabels);

    return (
      <StyledFeedbackSelector>
        <StyledInputContainer label={label} extraClasses={{ label: { transform: 'translateY(-20%)' } }}>
          <StyledGroup
            keys={feedbackKeys}
            label={label}
            value={feedback.type}
            onChange={this.changeType}
            feedbackLabels={feedbackLabels}
          />
        </StyledInputContainer>

        {feedback.type === 'custom' && (
          <StyledCustomHolder>
            <React.Suspense fallback={<div>Loading editor...</div>}>
        <StyledEditableHTML
              onChange={this.changeCustom}
              markup={feedback.custom || ''}
              toolbarOpts={toolbarOpts}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
      </React.Suspense>
          </StyledCustomHolder>
        )}

        {feedback.type === 'default' && <StyledDefaultHolder> {feedback.default}</StyledDefaultHolder>}
      </StyledFeedbackSelector>
    );
  }
}

export default FeedbackSelector;
