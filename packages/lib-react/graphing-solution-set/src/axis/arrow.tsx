// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing-solution-set/src/axis/arrow.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';

import { styled } from '@mui/material/styles';
import { types } from '@pie-lib/plot';

const StyledPath: any = styled('path')(({ theme }) => ({
  fill: `var(--arrow-color, ${theme.palette.common.black})`,
}));

export class Arrow extends React.Component {
  render() {
    const { x, y, className, scale } = this.props;
    let direction = this.props.direction || 'left';

    const xv = scale.x(x);
    const yv = scale.y(y);

    let transform = '';

    const getTransform = (x, y, rotate) => `translate(${x}, ${y}) rotate(${rotate})`;

    if (direction === 'left') {
      transform = getTransform(xv - 15, yv, 0);
    }

    if (direction === 'right') {
      transform = getTransform(xv + 15, yv, 180);
    }

    if (direction === 'up') {
      transform = getTransform(xv, yv - 15, 90);
    }

    if (direction === 'down') {
      transform = getTransform(xv, yv + 15, 270);
    }

    return <StyledPath d="m 0,0 8,-5 0,10 -8,-5" transform={transform} className={className} />;
  }
}

Arrow.propTypes = {
  y: PropTypes.number,
  x: PropTypes.number,
  direction: PropTypes.oneOf(['left', 'right', 'up', 'down']),
  className: PropTypes.string,
  scale: types.ScaleType.isRequired,
};

Arrow.defaultProps = {
  y: 0,
  x: 0,
  direction: 'left',
};

export default Arrow;
