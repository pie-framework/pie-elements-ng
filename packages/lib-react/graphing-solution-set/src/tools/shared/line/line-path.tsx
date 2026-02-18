// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing-solution-set/src/tools/shared/line/line-path.jsx
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
import { correct, disabled, incorrect, missing } from '../styles.js';
import * as vx from '@visx/shape';
import { color } from '@pie-lib/render-ui';

const dragging = () => ({
  strokeWidth: 7,
  stroke: color.defaults.BLACK,
});

const StyledDrawLine: any = styled(vx.LinePath, {
  shouldForwardProp: (prop) => !['disabled', 'correctness'].includes(prop),
})(({ disabled: isDisabled, correctness }) => ({
  fill: 'none',
  strokeWidth: 2,
  stroke: color.secondaryLight(),
  ...(isDisabled && {
    ...disabled('stroke'),
    strokeWidth: 2,
  }),
  ...(correctness === 'correct' && correct('stroke')),
  ...(correctness === 'incorrect' && incorrect('stroke')),
  ...(correctness === 'missing' && missing('stroke')),
}));

const StyledInteractionLine: any = styled(vx.LinePath, {
  shouldForwardProp: (prop) => !['disabled', 'correctness', 'isDragging'].includes(prop),
})(({ disabled: isDisabled, correctness, isDragging }) => ({
  strokeWidth: 6,
  fill: 'none',
  transition: 'stroke-width 200ms ease-in, stroke 200ms ease-in',
  stroke: 'transparent',
  '&:hover': dragging(),
  ...(isDragging && dragging()),
  ...(isDisabled && {
    ...disabled('stroke'),
    strokeWidth: 2,
  }),
  ...(correctness === 'correct' && correct('stroke')),
  ...(correctness === 'incorrect' && incorrect('stroke')),
  ...(correctness === 'missing' && missing('stroke')),
}));

export class RawLinePath extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    graphProps: types.GraphPropsType.isRequired,
    disabled: PropTypes.bool,
    correctness: PropTypes.string,
    from: types.PointType,
    to: types.PointType,
    isDragging: PropTypes.bool,
  };

  static defaultProps = {
    from: {},
    to: {},
  };

  render() {
    /* eslint-disable no-unused-vars */
    const { data, className, disabled, correctness, from, to, graphProps, isDragging, ...rest } = this.props;
    /* eslint-enable */

    return (
      <React.Fragment>
        <StyledDrawLine data={data} disabled={disabled} correctness={correctness} className={className} {...rest} />
        <StyledInteractionLine
          data={data}
          isDragging={isDragging}
          disabled={disabled}
          correctness={correctness}
          className={className}
          {...rest}
        />
      </React.Fragment>
    );
  }
}

export const LinePath = RawLinePath;
