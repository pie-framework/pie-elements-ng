// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import Check from '@mui/icons-material/Check';
import { styled } from '@mui/material/styles';
import { Group } from '@visx/group';
import debug from 'debug';

import { types } from '@pie-lib/plot';
import DraggableHandle, { DragHandle } from '../../common/drag-handle.js';
import MarkSlider from '../../common/mark-slider.js';
import { color } from '@pie-lib/render-ui';
import { bandKey } from '../../utils.js';
import { correct, incorrect } from '../../common/styles.js';

const log = debug('pie-lib:chart:bars');
const ICON_SIZE = 16; // 10px icon + 2px padding on all sides + 1px border
// how far above the column's top its focus ring reaches, so an empty column still shows one
const FOCUS_HEADROOM = 10;

export class RawPlot extends React.Component {
  static propTypes = {
    onChangeCategory: PropTypes.func,
    value: PropTypes.number,
    label: PropTypes.string,
    xBand: PropTypes.func,
    index: PropTypes.number.isRequired,
    graphProps: types.GraphPropsType.isRequired,
    CustomBarElement: PropTypes.func,
    interactive: PropTypes.bool,
    disabled: PropTypes.bool,
    correctness: PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    }),
    defineChart: PropTypes.bool,
    correctData: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string,
      }),
    ),
    className: PropTypes.string,
    language: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      dragValue: undefined,
      isHovered: false,
    };
  }

  handleMouseEnter: any = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave: any = () => {
    this.setState({ isHovered: false });
  };

  setDragValue = (dragValue) => this.setState({ dragValue });

  // the change a drag and a key both commit through
  changeValue: any = (value) => {
    const { label, onChangeCategory } = this.props;

    onChangeCategory({ label, value });
  };

  dragStop: any = () => {
    const { dragValue } = this.state;
    log('[dragStop]', dragValue);

    if (dragValue !== undefined) {
      this.changeValue(dragValue);
    }

    this.setDragValue(undefined);
  };

  dragValue: any = (existing, next) => {
    log('[dragValue] next:', next);

    this.setDragValue(next);
  };

  renderCorrectnessIcon: any = (barX, barWidth, correctVal, correctness, scale, pointHeight, pointDiameter) => {
    let iconY;

    if (correctVal === 0) {
      // if correct value is 0, position icon on the horizontal axis
      iconY = scale.y(0) - ICON_SIZE / 2;
    } else {
      const shapeIndex = correctVal - 1; // the index of the shape representing the correct value
      const shapeCenterY = scale.y(shapeIndex) - (pointHeight - pointDiameter) / 2 - pointDiameter / 2;
      iconY = shapeCenterY - ICON_SIZE / 2; // center the icon
    }

    return (
      <foreignObject x={barX + barWidth / 2 - ICON_SIZE / 2} y={iconY} width={ICON_SIZE} height={ICON_SIZE}>
        <Check className="correctnessIcon correctIcon smallIcon" title={correctness.label} />
      </foreignObject>
    );
  };

  render() {
    const {
      graphProps,
      value,
      label,
      xBand,
      index,
      CustomBarElement,
      interactive,
      disabled,
      correctness,
      defineChart,
      correctData,
      className,
      language,
    } = this.props;

    const { scale, range, size } = graphProps;
    const { max } = range || {};
    const { dragValue, isHovered } = this.state;

    const v = Number.isFinite(dragValue) ? dragValue : value;
    const barWidth = xBand.bandwidth();
    const barHeight = scale.y(range.max - v);
    const barX = xBand(bandKey({ label }, index));

    log('label:', label, 'barX:', barX, 'v: ', v, 'barHeight:', barHeight, 'barWidth: ', barWidth);

    const values = [];

    for (let i = 0; i < v; i++) {
      values.push(i);
    }

    const pointHeight = size.height / max;
    const pointDiameter = (pointHeight > barWidth ? barWidth : pointHeight) * 0.8;
    const Component = interactive ? DraggableHandle : DragHandle;
    const allowRolloverEvent = interactive && !correctness;

    return (
      <React.Fragment>
        <MarkSlider
          className={className}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          onTouchStart={this.handleMouseEnter}
          onTouchEnd={this.handleMouseLeave}
          enabled={interactive && !disabled}
          label={label}
          index={index}
          value={v}
          graphProps={graphProps}
          language={language}
          focusBox={{
            x: barX,
            y: scale.y(v) - FOCUS_HEADROOM,
            width: barWidth,
            height: pointHeight * values.length + FOCUS_HEADROOM,
          }}
          onChange={this.changeValue}
        >
          {isHovered && allowRolloverEvent && (
            <rect
              x={barX}
              y={scale.y(v)}
              width={barWidth}
              height={values?.length ? pointHeight * values.length : 0}
              stroke={color.defaults.BORDER_GRAY}
              strokeWidth={'4px'}
              fill={'transparent'}
            />
          )}
          {values.map((index) =>
            CustomBarElement({
              index,
              pointDiameter,
              barX,
              barWidth,
              pointHeight,
              label,
              value,
              scale,
            }),
          )}
          {correctness &&
            correctness.value === 'incorrect' &&
            (() => {
              const correctVal = parseFloat(correctData[index] && correctData[index].value);
              if (isNaN(correctVal)) return null;
              const selectedVal = v;

              // special case: if correct value is 0, only show the icon on the axis
              if (correctVal === 0) {
                return this.renderCorrectnessIcon(
                  barX,
                  barWidth,
                  correctVal,
                  correctness,
                  scale,
                  pointHeight,
                  pointDiameter,
                );
              }

              if (selectedVal > correctVal) {
                // selected is higher than correct: overlay the correct last segment
                const overlayValues = [];
                for (let i = 0; i < correctVal; i++) {
                  overlayValues.push(i);
                }
                const lastIndexOfOverlay = overlayValues.length - 1;
                const lastOverlayValue = overlayValues[lastIndexOfOverlay];
                const barX = xBand(bandKey({ label }, index));
                const barWidth = xBand.bandwidth();
                const pointHeight = size.height / max;
                const pointDiameter = (pointHeight > barWidth ? barWidth : pointHeight) * 0.8;
                return (
                  <>
                    <CustomBarElement
                      index={lastOverlayValue}
                      pointDiameter={pointDiameter + 10} // increase point diameter for dotted line
                      barX={barX}
                      barWidth={barWidth}
                      pointHeight={pointHeight}
                      label={label}
                      value={value}
                      scale={scale}
                      dottedOverline={true}
                    />
                    {this.renderCorrectnessIcon(
                      barX,
                      barWidth,
                      correctVal,
                      correctness,
                      scale,
                      pointHeight,
                      pointDiameter,
                    )}
                  </>
                );
              }
              // selected is lower than correct, render missing segment below the correct bar
              const valuesToRender = [];
              for (let i = selectedVal; i < correctVal; i++) {
                valuesToRender.push(i);
              }
              return (
                <>
                  {valuesToRender.map((idx) =>
                    CustomBarElement({
                      index: idx,
                      pointDiameter,
                      barX,
                      barWidth,
                      pointHeight,
                      label,
                      value,
                      scale,
                      dottedOverline: true,
                    }),
                  )}
                  {this.renderCorrectnessIcon(
                    barX,
                    barWidth,
                    correctVal,
                    correctness,
                    scale,
                    pointHeight,
                    pointDiameter,
                  )}
                </>
              );
            })()}
          <Component
            x={barX}
            y={v}
            interactive={interactive}
            disabled={disabled}
            width={barWidth}
            onDrag={(v) => this.dragValue(value, v)}
            onDragStop={this.dragStop}
            graphProps={graphProps}
            correctness={correctness}
            isHovered={isHovered}
            defineChart={defineChart}
            color={color.primaryDark()}
            isPlot
          />
        </MarkSlider>
      </React.Fragment>
    );
  }
}

const Bar: any = styled(RawPlot)(({ theme }) => ({
  '& .dot': {
    fill: color.visualElementsColors.PLOT_FILL_COLOR,
    '&.correct': correct('stroke'),
    '&.incorrect': incorrect('stroke'),
  },
  '& .dotColor': {
    fill: color.visualElementsColors.PLOT_FILL_COLOR,
    '&.correct': correct('fill'),
    '&.incorrect': incorrect('fill'),
  },
  '& .line': {
    stroke: color.visualElementsColors.PLOT_FILL_COLOR,
    '&.correct': correct('stroke'),
    '&.incorrect': incorrect('stroke'),
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
    display: 'block',
  },
  '& .smallIcon': {
    fontSize: '10px',
    width: '10px',
    height: '10px',
  },
}));

export class Plot extends React.Component {
  static propTypes = {
    data: PropTypes.array,
    onChangeCategory: PropTypes.func,
    xBand: PropTypes.func,
    graphProps: types.GraphPropsType.isRequired,
    defineChart: PropTypes.bool,
    CustomBarElement: PropTypes.func,
    correctData: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string,
      }),
    ),
    className: PropTypes.string,
    language: PropTypes.string,
  };

  render() {
    const {
      data,
      graphProps,
      xBand,
      CustomBarElement,
      onChangeCategory,
      defineChart,
      correctData,
      disabled,
      language,
    } = this.props;

    return (
      <Group>
        {(data || []).map((d, index) => (
          <Bar
            value={d.value}
            label={d.label}
            interactive={defineChart || d.interactive}
            defineChart={defineChart}
            disabled={disabled}
            xBand={xBand}
            index={index}
            // the value stays out of the key, so a change keeps the column mounted and focused
            key={`bar-${d.label}-${index}`}
            onChangeCategory={(category) => onChangeCategory(index, category)}
            graphProps={graphProps}
            CustomBarElement={CustomBarElement}
            correctness={d.correctness}
            correctData={correctData}
            language={language}
          />
        ))}
      </Group>
    );
  }
}

export default Plot;
