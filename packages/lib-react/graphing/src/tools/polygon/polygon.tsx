// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/polygon/polygon.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { alpha, styled } from '@mui/material/styles';
import { gridDraggable, types } from '@pie-lib/plot';
import * as utils from '../../utils';
import { color } from '@pie-lib/render-ui';
import { correct, disabled, incorrect, missing } from '../shared/styles';

const StyledPolygon: any = styled('polygon')(({ theme, disabled: isDisabled, correctness }) => ({
  fill: alpha(theme.palette.primary.light, 0.2),
  strokeWidth: 2,
  stroke: color.defaults.BLACK,
  ...(isDisabled && disabled('stroke')),
  ...(correctness === 'correct' && correct('stroke')),
  ...(correctness === 'incorrect' && incorrect('stroke')),
  ...(correctness === 'missing' && {
    ...missing('stroke'),
    stroke: 'inherit',
  }),
}));

const StyledPolyline: any = styled('polyline')(({ theme, disabled: isDisabled, correctness }) => ({
  fill: alpha(theme.palette.primary.light, 0.0),
  strokeWidth: 2,
  stroke: color.defaults.BLACK,
  pointerEvents: 'none',
  ...(isDisabled && disabled('stroke')),
  ...(correctness === 'correct' && correct('stroke')),
  ...(correctness === 'incorrect' && incorrect('stroke')),
  ...(correctness === 'missing' && {
    ...missing('stroke'),
    stroke: 'inherit',
  }),
}));

export const getPointString = (points, scale) => {
  return (points || [])
    .map((p) => {
      const scaledPoint = {
        x: scale.x(p.x),
        y: scale.y(p.y),
      };
      return `${scaledPoint.x},${scaledPoint.y}`;
    })
    .join(' ');
};

export class RawPolygon extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    points: PropTypes.arrayOf(types.PointType),
    graphProps: types.GraphPropsType.isRequired,
    closed: PropTypes.bool.isRequired,
    correctness: PropTypes.string,
  };

  static defaultProps = {
    points: [],
  };

  render() {
    const { points, className, disabled, correctness, graphProps, closed, ...rest } = this.props;
    const { scale } = graphProps;

    const pointString = getPointString(points, scale);
    
    if (closed) {
      return (
        <StyledPolygon
          points={pointString}
          className={className}
          disabled={disabled}
          correctness={correctness}
          {...rest}
        />
      );
    } else {
      return (
        <StyledPolyline
          points={pointString}
          className={className}
          disabled={disabled}
          correctness={correctness}
          {...rest}
        />
      );
    }
  }
}

export const Polygon = RawPolygon;

export default gridDraggable({
  bounds: (props, { domain, range }) => {
    const { points } = props;
    const area = utils.polygonToArea(points);
    return utils.bounds(area, domain, range);
  },
  anchorPoint: (props) => {
    const { points } = props;
    return points[0];
  },
  fromDelta: (props, delta) => {
    const { points } = props;

    return points.map((p) => utils.point(p).add(utils.point(delta)));
  },
})(Polygon);
