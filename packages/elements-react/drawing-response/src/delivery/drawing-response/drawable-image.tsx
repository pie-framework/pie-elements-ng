// @ts-nocheck

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
      alt=""
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
