// @ts-nocheck
/**
 * @synced-from pie-lib/packages/charting/src/line/line-dot.js
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
import { styled } from '@mui/material/styles';

import { types } from '@pie-lib/plot';
import { color } from '@pie-lib/render-ui';
import { dataToXBand } from '../utils';
import RawLine from './common/line';
import { CorrectnessIndicator, SmallCorrectPointIndicator } from '../common/correctness-indicators';

const StyledHandle: any = styled('circle')(() => ({}));

const StyledTransparentHandle: any = styled('circle')(() => ({
  height: '20px',
  fill: 'transparent', // keep it invisible
  stroke: 'none',
  pointerEvents: 'auto', // allow drag events
}));

const DraggableComponent = ({ scale, x, y, r, correctness, interactive, correctData, label, ...rest }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const allowRolloverEvent = !correctness && interactive;

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <StyledTransparentHandle
        cx={scale.x(x)}
        cy={scale.y(y)}
        r={r * 3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...rest}
      />
      <StyledHandle
        cx={scale.x(x)}
        cy={scale.y(y)}
        r={r}
        correctness={correctness}
        interactive={interactive}
        {...rest}
      />
      {/* show correctness indicators */}
      <CorrectnessIndicator scale={scale} x={x} y={y} r={r} correctness={correctness} interactive={interactive} />

      {/* show correct point if answer was incorrect */}
      <SmallCorrectPointIndicator
        scale={scale}
        x={x}
        r={r}
        correctness={correctness}
        correctData={correctData}
        label={label}
      />

      {/* show rollover rectangle */}
      {isHovered && allowRolloverEvent && (
        <rect
          x={scale.x(x) - r * 2}
          y={scale.y(y) - r * 2}
          width={r * 4}
          height={r * 4}
          stroke={color.defaults.BORDER_GRAY}
          strokeWidth="1"
          fill="none"
        />
      )}
    </g>
  );
};

DraggableComponent.propTypes = {
  scale: PropTypes.object,
  x: PropTypes.number,
  y: PropTypes.number,
  r: PropTypes.number,
  correctness: PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
  }),
  interactive: PropTypes.bool,
  correctData: PropTypes.array,
  label: PropTypes.string,
};

export class LineDot extends React.Component {
  static propTypes = {
    data: PropTypes.array,
    onChange: PropTypes.func,
    graphProps: types.GraphPropsType.isRequired,
  };

  render() {
    const props = this.props;
    const { data, graphProps } = props;
    const { scale = {}, size = {} } = graphProps || {};
    const xBand = dataToXBand(scale.x, data, size.width, 'lineDot');

    return <RawLine {...props} xBand={xBand} CustomDraggableComponent={DraggableComponent} />;
  }
}

export default () => ({
  type: 'lineDot',
  Component: LineDot,
  name: 'Line Dot',
});
