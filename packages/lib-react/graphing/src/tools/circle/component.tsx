// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/circle/component.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { BasePoint } from '../shared/point/index.js';
import BgCircle from './bg-circle.js';
import { equalPoints, getMiddleOfTwoPoints, point } from '../../utils.js';
import { types } from '@pie-lib/plot';
import { rootEdgeComponent } from '../shared/line/with-root-edge.js';
import ReactDOM from 'react-dom';
import MarkLabel from '../../mark-label.js';
import { isEmpty } from 'lodash-es';
import { color } from '@pie-lib/render-ui';
import { keyframes, styled } from '@mui/material/styles';

const opacityPulsate = (opacity) =>
  keyframes({
    '0%': { opacity: '0.0' },
    '50%': { opacity },
    '100%': { opacity: '0.0' },
  });

const getRadius = (from, outer) => {
  const c = point(from);
  return c.dist(point(outer));
};

export class RawBaseCircle extends React.Component {
  static propTypes = {
    building: PropTypes.bool,
    className: PropTypes.string,
    coordinatesOnHover: PropTypes.bool,
    correctness: PropTypes.string,
    from: types.PointType,
    disabled: PropTypes.bool,
    to: types.PointType,
    middle: types.PointType,
    onChange: PropTypes.func.isRequired,
    onDragStart: PropTypes.func,
    onDragStop: PropTypes.func,
    graphProps: types.GraphPropsType.isRequired,
    onClick: PropTypes.func,
    labelNode: PropTypes.object,
    labelModeEnabled: PropTypes.bool,
    changeMarkProps: PropTypes.func,
    limitLabeling: PropTypes.bool,
  };

  static defaultProps = {
    onClick: () => ({}),
  };

  onChangePoint: any = (point) => {
    const { middle, onChange } = this.props;
    const { from, to } = point;

    if (!equalPoints(from, to)) {
      if (middle) {
        point.middle = { ...middle, ...getMiddleOfTwoPoints(from, to) };
      }
      onChange(point);
    }
  };

  dragFrom: any = (draggedFrom) => {
    const { from, to } = this.props;

    if (from.label) draggedFrom.label = from.label;
    if (!equalPoints(draggedFrom, to)) {
      this.onChangePoint({ from: draggedFrom, to });
    }
  };

  dragTo: any = (draggedTo) => {
    const { from, to } = this.props;

    if (to.label) draggedTo.label = to.label;
    if (!equalPoints(from, draggedTo)) {
      this.onChangePoint({ from, to: draggedTo });
    }
  };

  dragCircle: any = (draggedFrom) => {
    const { from, to, onChange, middle } = this.props;
    const diff = point(from).sub(point(draggedFrom));
    const draggedTo = point(to).sub(diff);

    if (from.label) draggedFrom.label = from.label;
    if (to.label) draggedTo.label = to.label;

    const updated = { from: draggedFrom, to: draggedTo };
    if (middle) {
      updated.middle = { ...middle, ...getMiddleOfTwoPoints(draggedFrom, draggedTo) };
    }

    this.setState({ draggedroot: undefined, draggedOuter: undefined, isCircleDrag: false }, () => onChange(updated));
  };

  labelChange: any = (point, type) => {
    const { changeMarkProps } = this.props;
    const update = { ...point };
    if (!point.label || isEmpty(point.label)) delete update.label;
    changeMarkProps({ [type]: update });
  };

  clickPoint: any = (point, type, data) => {
    const { changeMarkProps, disabled, from, to, labelModeEnabled, limitLabeling, onClick } = this.props;

    if (!labelModeEnabled) {
      onClick(point || data);
      return;
    }

    if (disabled || limitLabeling) return;

    if (type === 'middle' && !point && from && to) {
      point = { ...point, ...getMiddleOfTwoPoints(from, to) };
    }

    changeMarkProps({ from, to, [type]: { label: '', ...point } });

    if (this.input[type]) {
      this.input[type].focus();
    }
  };

  input = {};

  render() {
    let {
      from,
      to,
      middle,
      disabled,
      building,
      coordinatesOnHover,
      onDragStart,
      onDragStop,
      onClick,
      correctness,
      graphProps,
      labelNode,
      labelModeEnabled,
    } = this.props;

    const common = { onDragStart, onDragStop, graphProps, onClick };
    to = to || from;
    const radius = getRadius(from, to);

    let fromLabelNode = null;
    let toLabelNode = null;
    let circleLabelNode = null;

    if (labelNode) {
      if (from?.label !== undefined) {
        fromLabelNode = ReactDOM.createPortal(
          <MarkLabel
            inputRef={(r) => (this.input.from = r)}
            disabled={!labelModeEnabled}
            mark={from}
            graphProps={graphProps}
            onChange={(label) => this.labelChange({ ...from, label }, 'from')}
          />,
          labelNode,
        );
      }

      if (to?.label !== undefined) {
        toLabelNode = ReactDOM.createPortal(
          <MarkLabel
            inputRef={(r) => (this.input.to = r)}
            disabled={!labelModeEnabled}
            mark={to}
            graphProps={graphProps}
            onChange={(label) => this.labelChange({ ...to, label }, 'to')}
          />,
          labelNode,
        );
      }

      if (middle?.label !== undefined) {
        circleLabelNode = ReactDOM.createPortal(
          <MarkLabel
            inputRef={(r) => (this.input.middle = r)}
            disabled={!labelModeEnabled}
            mark={middle}
            graphProps={graphProps}
            onChange={(label) => this.labelChange({ ...middle, label }, 'middle')}
          />,
          labelNode,
        );
      }
    }

    return (
      <g>
        <StyledBgCircle
          disabled={building || disabled}
          correctness={correctness}
          className={classNames(building && 'bgCircleBuilding')}
          x={from.x}
          y={from.y}
          radius={radius}
          onDrag={this.dragCircle}
          {...common}
          onClick={(data) => this.clickPoint(middle, 'middle', data)}
        />
        {circleLabelNode}

        <BasePoint
          disabled={building || disabled}
          coordinatesOnHover={coordinatesOnHover}
          correctness={correctness}
          labelNode={labelNode}
          x={to.x}
          y={to.y}
          onDrag={this.dragTo}
          {...common}
          onClick={(data) => this.clickPoint(to, 'to', data)}
        />
        {toLabelNode}

        <BasePoint
          disabled={building || disabled}
          coordinatesOnHover={coordinatesOnHover}
          correctness={correctness}
          labelNode={labelNode}
          x={from.x}
          y={from.y}
          className="from"
          onDrag={this.dragFrom}
          {...common}
          onClick={(data) => this.clickPoint(from, 'from', data)}
        />
        {fromLabelNode}
      </g>
    );
  }
}

// MUI v5 styled() replaces withStyles
const StyledBgCircle: any = styled(BgCircle)(() => ({
  '&.outerLine': {
    fill: 'rgba(0,0,0,0)',
    stroke: color.defaults.BLACK,
    strokeWidth: 4,
    '&:hover': {
      strokeWidth: 6,
      stroke: color.defaults.PRIMARY_DARK,
    },
  },
  '&.bgCircleBuilding': {
    stroke: color.defaults.BLACK,
    animation: `${opacityPulsate('0.3')} 2s ease-out infinite`,
    opacity: 1,
  },
}));

export const BaseCircle = RawBaseCircle;
const Component = rootEdgeComponent(BaseCircle);
export default Component;
