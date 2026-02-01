// @ts-nocheck
/**
 * @synced-from pie-elements/packages/inline-dropdown/configure/src/response-area.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';

const ResponseArea: any = styled('div')(({ theme }) => ({
  paddingBottom: theme.spacing(2.5),
}));

const ErrorText: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  paddingTop: theme.spacing(1),
}));

class ResponseAreaComponent extends React.Component {
  static propTypes = {
    editableHtmlProps: PropTypes.object.isRequired,
    responseAreasError: PropTypes.string,
    responseAreaChoicesError: PropTypes.string,
  };

  componentDidMount() {
    // eslint-disable-next-line react/no-find-dom-node
    const domNode = ReactDOM.findDOMNode(this);

    renderMath(domNode);
  }

  render() {
    const { editableHtmlProps, responseAreasError, responseAreaChoicesError } = this.props;

    return (
      <ResponseArea>
        <EditableHtml {...editableHtmlProps} />
        {responseAreasError && <ErrorText>{responseAreasError}</ErrorText>}
        {responseAreaChoicesError && <ErrorText>{responseAreaChoicesError}</ErrorText>}
      </ResponseArea>
    );
  }
}

export default ResponseAreaComponent;
