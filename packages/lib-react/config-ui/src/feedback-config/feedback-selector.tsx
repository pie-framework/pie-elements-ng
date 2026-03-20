// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/feedback-config/feedback-selector.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

//import EditableHTML from '@pie-lib/editable-html-tip-tap';
import { InputContainer as InputContainerImport } from '@pie-lib/render-ui';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
const InputContainer = unwrapReactInteropSymbol(InputContainerImport, 'InputContainer') || unwrapReactInteropSymbol(renderUi.InputContainer, 'InputContainer');
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
import PropTypes from 'prop-types';
import React from 'react';
import { styled } from '@mui/material/styles';
import Group from './group.js';

// - mathquill error window not defined
import EditableHtmlImport from '@pie-lib/editable-html-tip-tap';

const EditableHtml = EditableHtmlImport;
const StyledEditableHTML: any = styled(EditableHtml)(({ theme }) => ({
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
            <StyledEditableHTML
              onChange={this.changeCustom}
              markup={feedback.custom || ''}
              toolbarOpts={toolbarOpts}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
          </StyledCustomHolder>
        )}

        {feedback.type === 'default' && <StyledDefaultHolder> {feedback.default}</StyledDefaultHolder>}
      </StyledFeedbackSelector>
    );
  }
}

export default FeedbackSelector;
