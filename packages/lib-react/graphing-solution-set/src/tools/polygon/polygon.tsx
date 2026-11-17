// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { gridDraggable, types } from '@pie-lib/plot';
import * as utils from '../../utils.js';
import { correct, incorrect, missing } from '../shared/styles.js';

// A shaded region in evaluate wears its verdict in its outline, as a line does; the centre icon says the same
// without colour. A region the key shades and the student did not is outlined as a missing line is, thin and
// dashed, so where its edges lie on missing lines the two read as one dashed edge.
const evaluated = (correctness) => ({
  ...(correctness === 'correct' && correct('stroke')),
  ...(correctness === 'incorrect' && incorrect('stroke')),
  ...(correctness === 'missing' && {
    fill: 'transparent',
    ...missing('stroke'),
    strokeWidth: 1,
    strokeDasharray: '4 3',
  }),
  ...(correctness && { '&:hover': {} }),
});

const StyledPolygon: any = styled('polygon', {
  shouldForwardProp: (prop) => !['isSolution', 'correctness'].includes(prop),
})(({ isSolution, correctness }) => ({
  fill: isSolution ? 'rgb(60, 73, 150, 0.6)' : 'transparent',
  strokeWidth: 2,
  '&:hover': {
    fill: isSolution ? 'rgb(60, 73, 150, 0.6)' : 'rgb(0, 0, 0, 0.25)',
  },
  ...evaluated(correctness),
}));

const StyledPolyline: any = styled('polyline', {
  shouldForwardProp: (prop) => !['isSolution', 'correctness'].includes(prop),
})(({ isSolution, correctness }) => ({
  fill: isSolution ? 'rgb(60, 73, 150, 0.6)' : 'transparent',
  strokeWidth: 2,
  '&:hover': {
    fill: isSolution ? 'rgb(60, 73, 150, 0.6)' : 'rgb(0, 0, 0, 0.25)',
  },
  ...evaluated(correctness),
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
    isSolution: PropTypes.bool,
    points: PropTypes.arrayOf(types.PointType),
    graphProps: types.GraphPropsType.isRequired,
    closed: PropTypes.bool.isRequired,
    correctness: PropTypes.string,
  };

  static defaultProps = {
    points: [],
  };

  render() {
    const { points, className, correctness, graphProps, closed, isSolution, ...rest } = this.props;
    const { scale } = graphProps;

    const pointString = getPointString(points, scale);
    const Component = closed ? StyledPolygon : StyledPolyline;
    return (
      <Component
        points={pointString}
        isSolution={isSolution}
        correctness={correctness}
        className={className}
        {...rest}
      />
    );
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
