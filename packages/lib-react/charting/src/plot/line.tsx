// @ts-nocheck
/**
 * @synced-from pie-lib/packages/charting/src/plot/line.js
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
import { LinePath } from '@visx/shape';
import { Group } from '@visx/group';
import { styled } from '@mui/material/styles';

import { types } from '@pie-lib/plot';
import { dataToXBand } from '../utils';
import { color } from '@pie-lib/render-ui';
import Plot from './common/plot';
import { correct, incorrect } from '../common/styles';

const StyledLinePath: any = styled(LinePath)(() => ({
  stroke: color.visualElementsColors.PLOT_FILL_COLOR,
  '&.correct': correct('stroke'),
  '&.incorrect': incorrect('stroke'),
}));

const CustomBarElement = (props) => {
  const { index, pointDiameter, barX, barWidth, pointHeight, label, value, scale, dottedOverline } = props;

  const x = barX + (barWidth - pointDiameter) / 2;
  const y = scale.y(index) - (pointHeight - pointDiameter) / 2;
  const EXTRA_PADDING = 2;

  return dottedOverline ? (
    <rect
      key={`point-${label}-${value}-${index}`}
      x={x - EXTRA_PADDING}
      y={y - pointDiameter - EXTRA_PADDING}
      width={pointDiameter + EXTRA_PADDING * 2}
      height={pointDiameter + EXTRA_PADDING * 2}
      strokeDasharray="4,4"
      stroke={color.defaults.BORDER_GRAY}
      fill="none"
    />
  ) : (
    <Group>
      <StyledLinePath
        data={[
          { x, y },
          { x: x + pointDiameter, y: y - pointDiameter },
        ]}
        key={`point-${label}-${value}-${index}-1`}
        className={'line'}
        x={(d) => d.x}
        y={(d) => d.y}
        strokeWidth={pointDiameter / 5}
      />
      <StyledLinePath
        data={[
          { x, y: y - pointDiameter },
          { x: x + pointDiameter, y },
        ]}
        key={`point-${label}-${value}-${index}-2`}
        x={(d) => d.x}
        y={(d) => d.y}
        strokeWidth={pointDiameter / 5}
        className={'line'}
      />
    </Group>
  );
};

CustomBarElement.propTypes = {
  index: PropTypes.number,
  pointDiameter: PropTypes.number,
  barX: PropTypes.number,
  barWidth: PropTypes.number,
  pointHeight: PropTypes.number,
  value: PropTypes.number,
  label: PropTypes.string,
  scale: PropTypes.object,
  dottedOverline: PropTypes.bool,
};

export class LinePlot extends React.Component {
  static propTypes = {
    data: PropTypes.array,
    onChange: PropTypes.func,
    graphProps: types.GraphPropsType.isRequired,
  };

  render() {
    const props = this.props;
    const { data, graphProps } = props;
    const { scale = {}, size = {} } = graphProps || {};
    const xBand = dataToXBand(scale.x, data, size.width, 'linePlot');

    return <Plot {...props} xBand={xBand} CustomBarElement={CustomBarElement} />;
  }
}

export default () => ({
  type: 'linePlot',
  Component: LinePlot,
  name: 'Line Plot',
});
