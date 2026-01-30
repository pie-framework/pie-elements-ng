// @ts-nocheck
/**
 * @synced-from pie-lib/packages/charting/src/line/common/drag-handle.jsx
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
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

import { gridDraggable, utils, types } from '@pie-lib/plot';
import { color } from '@pie-lib/render-ui';
import { disabled } from '../../common/styles';

const StyledDragHandle: any = styled('g')(({ theme }) => ({
  color: 'black',
  '& .handle': {
    transition: 'fill 200ms linear, height 200ms linear',
    '&.non-interactive': disabled('fill'),
  },
  '& .transparentHandle': {
    height: '20px',
    fill: 'transparent',
    stroke: 'transparent',
  },
  '& .line': {
    stroke: color.defaults.TEXT,
    transition: 'fill 200ms linear, height 200ms linear',
    '&.non-interactive': disabled('stroke'),
  },
  '& .disabledPoint': {
    fill: color.defaults.BLACK + ' !important',
    stroke: color.defaults.BLACK + ' !important',
  },
  '& .correctIcon': {
    backgroundColor: color.correct(),
  },
  '& .incorrectIcon': {
    backgroundColor: color.incorrectWithIcon(),
  },
  '& .correctnessIcon': {
    borderRadius: theme.spacing(2),
    color: color.defaults.WHITE,
    fontSize: '16px',
    width: '16px',
    height: '16px',
    padding: '2px',
    border: `1px solid ${color.defaults.WHITE}`,
    stroke: 'initial',
    boxSizing: 'unset', // to override the default border-box in IBX
  },
  '& .smallIcon': {
    fontSize: '10px',
    width: '10px',
    height: '10px',
  },
}));

class RawDragHandle extends React.Component {
  static propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number,
    graphProps: types.GraphPropsType.isRequired,
    className: PropTypes.string,
    interactive: PropTypes.bool,
    CustomDraggableComponent: PropTypes.func,
    correctness: PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    }),
  };

  render() {
    const {
      x,
      y,
      graphProps,
      className,
      interactive,
      CustomDraggableComponent,
      correctness,
      ...rest
    } = this.props;
    const { scale } = graphProps;

    if (!CustomDraggableComponent) {
      return null;
    }

    return (
      <StyledDragHandle>
        <CustomDraggableComponent
          scale={scale}
          x={x}
          y={y}
          className={classNames(className, !interactive && 'non-interactive')}
          correctness={correctness}
          interactive={interactive}
          {...rest}
        />
      </StyledDragHandle>
    );
  }
}

export const DragHandle = RawDragHandle;

const DraggableHandle = gridDraggable({
  axis: 'y',
  fromDelta: (props, delta) => {
    //TODO: should be in grid-draggable, if axis is y delta.x should always be 0.
    delta.x = 0;
    const newPoint = utils.point(props).add(utils.point(delta));

    return newPoint.y;
  },
  bounds: (props, { domain, range }) => {
    const area = { left: 0, top: props.y, bottom: props.y, right: 0 };

    return utils.bounds(area, domain, range);
  },
  anchorPoint: (props) => {
    return { x: props.x, y: props.y };
  },
})(DragHandle);

export default DraggableHandle;
