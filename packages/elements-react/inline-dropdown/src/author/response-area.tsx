// @ts-nocheck

import React from 'react';
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

  containerRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    // renderMath with no element renders the whole document body.
    if (this.containerRef.current) {
      renderMath(this.containerRef.current);
    }
  }

  render() {
    const { editableHtmlProps, responseAreasError, responseAreaChoicesError } = this.props;

    return (
      <ResponseArea ref={this.containerRef}>
        <EditableHtml {...editableHtmlProps} />
        {responseAreasError && <ErrorText>{responseAreasError}</ErrorText>}
        {responseAreaChoicesError && <ErrorText>{responseAreaChoicesError}</ErrorText>}
      </ResponseArea>
    );
  }
}

export default ResponseAreaComponent;
