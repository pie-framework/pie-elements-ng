// @ts-nocheck
/**
 * @synced-from pie-lib/packages/charting/src/grid.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { GridRows, GridColumns } from '@visx/grid';

import { types } from '@pie-lib/plot';
import { color } from '@pie-lib/render-ui';

const StyledGridGroup: any = styled('g')(() => ({
  stroke: color.primaryLight(),
}));

export class Grid extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    graphProps: types.GraphPropsType.isRequired,
    xBand: PropTypes.func,
    columnTickValues: PropTypes.array,
    rowTickValues: PropTypes.array,
  };

  static defaultProps = {};

  render() {
    const { graphProps, xBand, rowTickValues, columnTickValues } = this.props;
    const { scale = {}, size = {}, range = {} } = graphProps || {};
    const { step = 0, labelStep = 0 } = range;
    const highlightNonLabel = step && labelStep && step < labelStep;
    // if highlightNonLabel is true, we need to separate the unlabled lines in order to render them in a different color
    const { unlabeledLines, labeledLines } = (rowTickValues || []).reduce(
      (acc, value) => {
        if (highlightNonLabel && value % labelStep !== 0) {
          acc.unlabeledLines.push(value);
        } else {
          acc.labeledLines.push(value);
        }
        return acc;
      },
      { unlabeledLines: [], labeledLines: [] },
    );

    return (
      <StyledGridGroup>
        <GridRows
          scale={scale.y}
          width={size.width}
          tickValues={unlabeledLines}
          lineStyle={{
            stroke: color.fadedPrimary(),
            strokeWidth: 1,
          }}
        />
        <GridRows
          scale={scale.y}
          width={size.width}
          tickValues={labeledLines}
          lineStyle={{
            stroke: color.visualElementsColors.GRIDLINES_COLOR,
            strokeWidth: 1,
          }}
        />
        <GridColumns scale={xBand} height={size.height} offset={xBand.bandwidth() / 2} tickValues={columnTickValues} />
      </StyledGridGroup>
    );
  }
}

export default Grid;
