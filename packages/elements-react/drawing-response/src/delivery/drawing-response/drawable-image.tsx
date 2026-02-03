// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/src/drawing-response/drawable-image.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

const ImageContainer: any = styled('div')({
  position: 'relative',
  width: 'fit-content',
});

const Image: any = styled('img')({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
});

const DrawableImage = ({ url, dimensions: { height, width } }) => (
  <ImageContainer>
    <Image
      alt="drawing-response-image"
      src={url}
      style={{
        height,
        maxWidth: width,
        maxHeight: 350,
        width,
      }}
    />
  </ImageContainer>
);

DrawableImage.propTypes = {
  dimensions: PropTypes.object.isRequired,
  url: PropTypes.string.isRequired,
};

export default DrawableImage;
