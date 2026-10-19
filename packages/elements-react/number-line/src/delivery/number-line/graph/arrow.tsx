// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';

const StyledPath: any = styled('path')({
  fill: color.primary(),
});

export function Arrow({ x = 0, y = 0, direction = 'left', className }) {
  let transform = `translate(${x || 0},${y})`;

  if (direction && direction === 'right') {
    transform += ' rotate(180)';
  }

  return <StyledPath d="m 0,0 8,-5 0,10 -8,-5" transform={transform} className={className} />;
}

Arrow.propTypes = {
  y: PropTypes.number,
  x: PropTypes.number,
  direction: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
};

export default Arrow;
