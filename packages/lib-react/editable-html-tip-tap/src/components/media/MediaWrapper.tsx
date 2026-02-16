// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/components/media/MediaWrapper.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

const StyledWrapper: any = styled('span', {
  shouldForwardProp: (prop) => prop !== 'editor',
})(({ editor }) => ({
  position: 'relative',
  ...(editor && {
    display: 'inline-block',
    overflow: 'hidden',
  }),
}));

class MediaWrapper extends React.Component {
  static propTypes = {
    children: PropTypes.array,
    editor: PropTypes.bool,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  };

  render() {
    const { editor, children, width, ...rest } = this.props;

    return (
      <StyledWrapper
        editor={editor}
        {...rest}
        style={{
          width: width || 300,
        }}
      >
        {children}
      </StyledWrapper>
    );
  }
}

export default MediaWrapper;
