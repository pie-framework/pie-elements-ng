// @ts-nocheck
/**
 * @synced-from pie-lib/packages/charting/src/line/common/line.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import PropTypes from 'prop-types';
import { types } from '@pie-lib/plot';
import DraggableHandle, { DragHandle } from './drag-handle';
import { styled } from '@mui/material/styles';
import { isEqual } from 'lodash-es';
import { color } from '@pie-lib/render-ui';

const getData = (data, domain) => {
  const { max } = domain || {};
  const length = data.length;

  if (!max || !length) {
    return [];
  }

  return data.map((el, i) => ({
    ...el,
    x: length > 1 ? i * (max / (length - 1)) : 0.5,
    y: el.value,
  }));
};

const StyledLinePath: any = styled(LinePath)(() => ({
  fill: 'transparent',
  stroke: color.defaults.TERTIARY,
  strokeWidth: 3,
  transition: 'stroke 200ms ease-in, stroke-width 200ms ease-in',
}));

export class RawLine extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.number,
    label: PropTypes.string,
    xBand: PropTypes.func,
    index: PropTypes.number.isRequired,
    graphProps: types.GraphPropsType.isRequired,
    defineChart: PropTypes.bool,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.number,
      }),
    ),
    CustomDraggableComponent: PropTypes.func,
    correctData: PropTypes.array,
  };

  static defaultProps = {
    index: 0,
  };

  constructor(props) {
    super(props);
    this.state = {
      dragValue: undefined,
      line: getData(props.data, props.graphProps.domain),
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!isEqual(this.props.data, nextProps.data)) {
      this.setState({
        line: getData(nextProps.data, nextProps.graphProps.domain),
      });
    }
  }

  setDragValue = (line) => this.setState({ line });

  dragStop: any = (index) => {
    const { onChange } = this.props;
    this.setState({ dragging: false }, () => {
      onChange(index, this.state.line[index]);
    });
  };

  dragValue: any = (index, existing, next) => {
    const newLine = [...this.state.line];
    newLine[index].dragValue = next;
    this.setDragValue(newLine);
  };

  render() {
    const { graphProps, data, CustomDraggableComponent, defineChart, correctData } = this.props;
    const { line: lineState, dragging } = this.state;
    const { scale } = graphProps;
    const lineToUse = dragging ? lineState : getData(data, graphProps.domain);

    return (
      <React.Fragment>
        <StyledLinePath
          data={lineToUse}
          x={(d) => scale.x(d.x)}
          y={(d) => scale.y(d.dragValue !== undefined ? d.dragValue : d.y)}
          className="line"
        />
        {lineToUse &&
          lineToUse.map((point, i) => {
            const r = 6;
            const enableDraggable = defineChart || point.interactive;
            const Component = enableDraggable ? DraggableHandle : DragHandle;
                        
            return (
              <Component
                key={`point-${point.x}-${i}`}
                x={point.x}
                y={point.dragValue !== undefined ? point.dragValue : point.y}
                interactive={enableDraggable}
                r={r}
                onDragStart={() => this.setState({ dragging: true })}
                onDrag={(v) => this.dragValue(i, point.dragValue !== undefined ? point.dragValue : point.y, v)}
                onDragStop={() => this.dragStop(i)}
                graphProps={graphProps}
                CustomDraggableComponent={CustomDraggableComponent}
                correctness={point.correctness}
                correctData={correctData}
                label={point.label}
              />
            );
          })}
      </React.Fragment>
    );
  }
}

const StyledLine: any = styled(RawLine)(() => ({
  '& .line': {
    fill: 'transparent',
    stroke: color.defaults.TERTIARY,
    strokeWidth: 3,
    transition: 'stroke 200ms ease-in, stroke-width 200ms ease-in',
  },
}));

export class Line extends React.Component {
  static propTypes = {
    data: PropTypes.array,
    onChange: PropTypes.func,
    xBand: PropTypes.func,
    graphProps: types.GraphPropsType.isRequired,
    CustomDraggableComponent: PropTypes.func,
    defineChart: PropTypes.bool,
    correctData: PropTypes.array,
  };

  changeLine: any = (index, category) => {
    const { onChange } = this.props;
    const newLine = [...this.props.data];
    const { dragValue, value } = category;

    newLine[index].value = dragValue >= 0 ? dragValue : value;

    onChange(newLine);
  };

  render() {
    const props = this.props;

    return (
      <Group>
        <StyledLine {...props} onChange={this.changeLine} />
      </Group>
    );
  }
}

export default Line;
