// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { AxisBottom, AxisLeft } from '@visx/axis';
import Checkbox from '@mui/material/Checkbox';

import { types } from '@pie-lib/plot';
import { color } from '@pie-lib/render-ui';
import { AlertDialog } from '@pie-lib/config-ui';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import Translator from '@pie-lib/translator';

import { TickCorrectnessIndicator } from './common/correctness-indicators.js';
import { bandKey, getRotateAngle, getRotatedLabelOverhang, getTickValues, textOf } from './utils.js';
import MarkLabel from './mark-label.js';

const { translator } = Translator;

// how tall a category label can be before it reaches the axis label below it: a one line input fits,
// a fraction does not
const LABEL_ROOM = 24;

// one document-level MutationObserver shared across all
// RawChartAxes instances so that no chart misses a MathJax render batch
const _mathCallbacks = new Set();
let _docObserver = null;

function registerMathCallback(cb) {
  _mathCallbacks.add(cb);

  if (!_docObserver && typeof document !== 'undefined') {
    _docObserver = new MutationObserver(() => {
      _mathCallbacks.forEach((fn) => fn());
    });
    _docObserver.observe(document.body, { childList: true, subtree: true });
  }
}

function unregisterMathCallback(cb) {
  _mathCallbacks.delete(cb);

  if (_mathCallbacks.size === 0 && _docObserver) {
    _docObserver.disconnect();
    _docObserver = null;
  }
}

const StyledErrorText: any = styled('text')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  fill: theme.palette.error.main,
}));

const StyledCheckbox: any = styled(Checkbox)(() => ({
  color: `${color.tertiary()} !important`,
}));

const StyledAxesGroup: any = styled('g')(({ theme }) => ({
  '& .vx-axis-line': {
    stroke: color.visualElementsColors.AXIS_LINE_COLOR,
    strokeWidth: 2,
  },
  '& .vx-axis-tick': {
    fill: color.visualElementsColors.AXIS_TICK_COLOR,
    '& line': {
      stroke: color.visualElementsColors.AXIS_TICK_COLOR,
      strokeWidth: 2,
    },
    fontFamily: theme.typography.body1?.fontFamily,
    fontSize: theme.typography.fontSize,
    textAnchor: 'middle',
  },
}));

const correctnessIconStyles = (theme) => ({
  borderRadius: theme.spacing(2),
  color: color.defaults.WHITE,
  fontSize: '16px',
  width: '16px',
  height: '16px',
  padding: '2px',
  border: `1px solid ${color.defaults.WHITE}`,
  boxSizing: 'unset', // to override the default border-box in IBX
});

const incorrectIconStyles = {
  backgroundColor: color.incorrectWithIcon(),
};

const correctIconStyles = {
  backgroundColor: color.correct(),
};

export class TickComponent extends React.Component {
  static propTypes = {
    defineChart: PropTypes.bool,
    error: PropTypes.any,
  };

  constructor(props) {
    super(props);
    this.state = {
      dialog: {
        open: false,
      },
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.autoFocus && !prevProps.autoFocus) {
      this.props.onAutoFocusUsed();
    }
  }

  handleAlertDialog = (open, callback) =>
    this.setState(
      {
        dialog: { open },
      },
      callback,
    );

  changeCategory: any = (index, newLabel) => {
    const { categories, onChangeCategory } = this.props;
    const category = categories[index];

    onChangeCategory(index, { ...category, label: newLabel });
  };

  changeInteractive: any = (index, value) => {
    const { categories, onChangeCategory } = this.props;
    const category = categories[index];

    if (!value) {
      this.setState({
        dialog: {
          open: true,
          title: 'Warning',
          text: 'This will remove the correct answer value that has been defined for this category.',
          onConfirm: () =>
            this.handleAlertDialog(false, onChangeCategory(index, { ...category, interactive: !category.interactive })),
          onClose: () => this.handleAlertDialog(false),
        },
      });
    } else {
      onChangeCategory(index, { ...category, interactive: !category.interactive });
    }
  };

  changeEditable: any = (index, value) => {
    const { categories, onChangeCategory } = this.props;
    const category = categories[index];

    if (!value) {
      this.setState({
        dialog: {
          open: true,
          title: 'Warning',
          text: 'This will remove the correct answer category name that has been defined for this category.',
          onConfirm: () =>
            this.handleAlertDialog(
              false,
              onChangeCategory(index, { ...category, editable: !category.editable || false }),
            ),
          onClose: () => this.handleAlertDialog(false),
        },
      });
    } else {
      onChangeCategory(index, { ...category, editable: !category.editable || false });
    }
  };

  splitText: any = (text, maxChar) => {
    let chunks = [];
    while ((text || '').length > 0) {
      let indexToSplit;
      if (text.length > maxChar) {
        indexToSplit = text.lastIndexOf(' ', maxChar);
        if (indexToSplit === -1) {
          indexToSplit = maxChar;
        }
      } else {
        indexToSplit = text.length;
      }
      chunks.push(text.substring(0, indexToSplit));
      text = text.substring(indexToSplit).trim();
    }
    return chunks;
  };

  render() {
    const {
      categories,
      xBand,
      bandWidth,
      barWidth,
      rotate,
      top,
      graphProps,
      defineChart,
      chartingOptions,
      x,
      y,
      formattedValue,
      changeInteractiveEnabled,
      changeEditableEnabled,
      error,
      autoFocus,
      hiddenLabelRef,
      showCorrectness,
      language,
    } = this.props;

    if (!formattedValue) {
      return null;
    }

    // Create classes object for TickCorrectnessIndicator compatibility
    const classes = {
      correctnessIcon: correctnessIconStyles,
      incorrectIcon: incorrectIconStyles,
      correctIcon: correctIconStyles,
    };

    const { dialog } = this.state;
    const { changeEditable, changeInteractive } = chartingOptions || {};
    const index = parseInt(formattedValue.split('-')[0], 10);
    const category = categories[index];
    const { editable, interactive, label, correctness } = category || {};
    const barX = xBand(bandKey({ label }, index));
    const longestCategory = (categories || []).reduce(
      (a, b) => {
        const lengthA = a && a.label ? a.label.length : 0;
        const lengthB = b && b.label ? b.label.length : 0;

        return lengthA > lengthB ? a : b;
      },
      { label: '' },
    );
    const distinctMessages = error ? [...new Set(Object.values(error))].join(' ') : '';

    return (
      <g>
        <foreignObject
          x={bandWidth ? barX : x - barWidth / 2}
          y={18}
          width={barWidth}
          height={4}
          style={{ pointerEvents: 'none', overflow: 'visible' }}
        >
          {index === 0 && (
            <MarkLabel
              isHiddenLabel={true}
              inputRef={hiddenLabelRef}
              disabled={true}
              mark={longestCategory}
              graphProps={graphProps}
              barWidth={barWidth}
            />
          )}

          <MarkLabel
            autoFocus={defineChart && autoFocus}
            inputRef={(r) => (this.input = r)}
            disabled={!defineChart && !editable}
            mark={category}
            graphProps={graphProps}
            onChange={(newLabel) => this.changeCategory(index, newLabel)}
            barWidth={barWidth}
            rotate={rotate}
            correctness={correctness}
            error={error && error[index]}
            ariaLabel={translator.t('charting.categoryLabel', { lng: language, index: index + 1 })}
            mathAriaLabel={translator.t('charting.categoryLabelValue', {
              lng: language,
              index: index + 1,
              label: textOf(label),
              interpolation: { escapeValue: false },
            })}
            limitCharacters
            correctnessIndicator={
              showCorrectness &&
              correctness && (
                <TickCorrectnessIndicator correctness={correctness} interactive={interactive} classes={classes} />
              )
            }
          />
        </foreignObject>

        {error && index === 0 && (
          <StyledErrorText y={y + 23} height={6} textAnchor="start">
            {distinctMessages}
          </StyledErrorText>
        )}

        {defineChart && index === 0 && (
          <svg
            x={-100}
            style={{
              overflow: 'visible',
            }}
          >
            {changeInteractiveEnabled && (
              <text
                y={y + 90 + top}
                width={barWidth}
                height={4}
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  wordBreak: 'break-word',
                  maxWidth: barWidth,
                  display: 'inline-block',
                }}
              >
                {this.splitText(changeInteractive?.authoringLabel, 20).map((word, index) => (
                  <tspan key={index} x="0" dy={`${index > 0 ? '1.2em' : '.6em'}`}>
                    {word}
                  </tspan>
                ))}
              </text>
            )}

            {changeEditableEnabled && (
              <text
                y={y + 145 + top}
                width={barWidth}
                height={4}
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  wordBreak: 'break-word',
                  maxWidth: barWidth,
                  display: 'inline-block',
                }}
              >
                {this.splitText(changeEditable?.authoringLabel, 20).map((word, index) => (
                  <tspan key={index} x="0" dy={`${index > 0 ? '1.2em' : '.6em'}`}>
                    {word}
                  </tspan>
                ))}
              </text>
            )}
          </svg>
        )}

        {defineChart && changeInteractiveEnabled && (
          <foreignObject
            x={x - 24}
            y={y + 80 + top}
            width={barWidth}
            height={4}
            style={{ pointerEvents: 'visible', overflow: 'visible' }}
          >
            <StyledCheckbox
              style={{ position: 'fixed' }}
              checked={interactive}
              onChange={(e) => this.changeInteractive(index, e.target.checked)}
            />
          </foreignObject>
        )}

        {defineChart && changeEditableEnabled && (
          <foreignObject
            x={x - 24}
            y={y + 130 + top}
            width={barWidth}
            height={4}
            style={{ pointerEvents: 'visible', overflow: 'visible' }}
          >
            <StyledCheckbox
              style={{ position: 'fixed' }}
              checked={editable}
              onChange={(e) => this.changeEditable(index, e.target.checked)}
            />
          </foreignObject>
        )}

        <foreignObject
          x={x - 24}
          y={y + 100 + top}
          width={barWidth}
          height={4}
          style={{ pointerEvents: 'visible', overflow: 'visible' }}
        >
          <AlertDialog
            open={dialog.open}
            title={dialog.title}
            text={dialog.text}
            onClose={dialog.onClose}
            onConfirm={dialog.onConfirm}
          />
        </foreignObject>
      </g>
    );
  }
}

TickComponent.propTypes = {
  categories: PropTypes.array,
  xBand: PropTypes.func,
  bandWidth: PropTypes.number,
  barWidth: PropTypes.number,
  rotate: PropTypes.number,
  top: PropTypes.number,
  x: PropTypes.number,
  y: PropTypes.number,
  graphProps: PropTypes.object,
  formattedValue: PropTypes.string,
  onChangeCategory: PropTypes.func,
  onChange: PropTypes.func,
  error: PropTypes.object,
  defineChart: PropTypes.bool,
  chartingOptions: PropTypes.object,
  changeInteractiveEnabled: PropTypes.bool,
  changeEditableEnabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  onAutoFocusUsed: PropTypes.func,
  showCorrectness: PropTypes.bool,
  hiddenLabelRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(Element) })]),
  language: PropTypes.string,
};

export class RawChartAxes extends React.Component {
  static propTypes = {
    bottomScale: PropTypes.func,
    categories: PropTypes.array,
    defineChart: PropTypes.bool,
    error: PropTypes.any,
    graphProps: types.GraphPropsType.isRequired,
    xBand: PropTypes.func,
    leftAxis: PropTypes.bool,
    onChange: PropTypes.func,
    onChangeCategory: PropTypes.func,
    top: PropTypes.number,
    theme: PropTypes.object,
    chartingOptions: PropTypes.object,
    changeInteractiveEnabled: PropTypes.bool,
    changeEditableEnabled: PropTypes.bool,
    autoFocus: PropTypes.bool,
    onAutoFocusUsed: PropTypes.func,
    showCorrectness: PropTypes.bool,
    hiddenLabelRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(Element) })]),
    language: PropTypes.string,
    onLabelOverhang: PropTypes.func,
  };

  state = { height: 0, width: 0, labelHeight: 0 };

  reportedOverhang = 0;

  // the bar width, and the angle the category labels are drawn at
  labelLayout: any = () => {
    const { graphProps, xBand, categories = [], theme } = this.props;
    const { scale = {}, domain = {} } = graphProps || {};
    const { height, width } = this.state;

    const bandWidth = xBand && typeof xBand.bandwidth === 'function' && xBand.bandwidth();
    // for chartType "line", bandWidth will be 0, so we have to calculate it
    const barWidth = bandWidth || (scale.x && scale.x(domain.max) / categories.length);

    const fontSize = theme && theme.typography ? theme.typography.fontSize : 14;
    // this mostly applies for labels that are not editable
    const rotateBecauseOfHeight = getRotateAngle(fontSize, height);
    // this applies for labels that are editable
    const rotateBecauseOfWidth = width > barWidth ? 25 : 0;

    return { bandWidth, barWidth, rotate: rotateBecauseOfHeight || rotateBecauseOfWidth };
  };

  // tells the chart how much lower the longest label reaches rotated, and the tallest label reaches
  // past its room, so it reserves that room
  reportLabelOverhang: any = () => {
    const { onLabelOverhang } = this.props;
    const { height, width, labelHeight } = this.state;
    const overhang =
      getRotatedLabelOverhang(width, height, this.labelLayout().rotate) + Math.max(0, labelHeight - LABEL_ROOM);

    if (onLabelOverhang && overhang !== this.reportedOverhang) {
      this.reportedOverhang = overhang;
      onLabelOverhang(overhang);
    }
  };

  measureHiddenLabel: any = () => {
    if (!this.hiddenLabelRef) return;

    const mjx = this.hiddenLabelRef.querySelector('mjx-container');
    const input = this.hiddenLabelRef.querySelector('input');
    const target = mjx || input || this.hiddenLabelRef;
    const rect = target.getBoundingClientRect();
    const height = Math.floor(rect.height);
    const width = Math.floor(rect.width);
    // the unrotated height of the tallest label rendered as math; MathJax sizes these after it renders,
    // so their size is observed too
    const mathLabels = this.axesNode ? [...this.axesNode.querySelectorAll('[data-math-label]')] : [];
    mathLabels.forEach((label) => this._sizeObserver?.observe(label));
    const labelHeight = Math.max(0, ...mathLabels.map((label) => label.offsetHeight));

    if (height !== this.state.height || width !== this.state.width || labelHeight !== this.state.labelHeight) {
      this.setState({ height, width, labelHeight });
    }
  };

  // called by the document-level observer on every DOM mutation.
  // only re-measures once mjx-container is present in our labels.
  _onDocMutation: any = () => {
    if (!this.hiddenLabelRef) return;
    if (this.axesNode?.querySelector('mjx-container')) {
      this.measureHiddenLabel();
    }
  };

  observeHiddenLabel: any = (el) => {
    if (!el) return;

    const containsLatex = el.querySelector('[data-latex], [data-raw]');

    if (containsLatex) {
      renderMath(el);
    }

    if (el.querySelector('mjx-container') || !containsLatex) {
      this.measureHiddenLabel();
    }
    // always register: if mjx-container isn't there yet, the doc observer will
    // call _onDocMutation when MathJax finishes rendering any element on the page.
    registerMathCallback(this._onDocMutation);
    this.observeHiddenLabelSize(el);
  };

  // AutosizeInput sizes the input after the label mounts, so the width read on mount is the unsized
  // one; measure again whenever the label's size changes
  observeHiddenLabelSize: any = (el) => {
    if (el === this._sizedLabel || typeof ResizeObserver === 'undefined') return;

    this._sizeObserver?.disconnect();
    this._sizedLabel = el;
    this._sizeObserver = new ResizeObserver(() => this.measureHiddenLabel());
    this._sizeObserver.observe(el);
  };

  setHiddenLabelRef: any = (ref) => {
    if (ref && ref !== this.hiddenLabelRef) {
      this.hiddenLabelRef = ref;
      this.observeHiddenLabel(ref);
    }
  };

  componentDidMount() {
    if (this.hiddenLabelRef) {
      this.observeHiddenLabel(this.hiddenLabelRef);
    }
    this.reportLabelOverhang();
  }

  componentWillUnmount() {
    unregisterMathCallback(this._onDocMutation);
    this._sizeObserver?.disconnect();
    this._sizedLabel = null;
    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.categories !== this.props.categories) {
      if (this._updateTimer) clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(() => this.measureHiddenLabel(), 50);
    }
    this.reportLabelOverhang();
  }

  render() {
    const {
      graphProps,
      xBand,
      leftAxis,
      onChange,
      onChangeCategory,
      categories = [],
      top,
      defineChart,
      chartingOptions,
      changeInteractiveEnabled,
      changeEditableEnabled,
      autoFocus,
      onAutoFocusUsed,
      error,
      showCorrectness,
      language,
    } = this.props;

    const { scale = {}, range = {}, size = {} } = graphProps || {};

    const bottomScale = xBand && typeof xBand.rangeRound === 'function' && xBand.rangeRound([0, size.width]);
    const { bandWidth, barWidth, rotate } = this.labelLayout();

    const rowTickValues = getTickValues({ ...range, step: range.labelStep });

    const getTickLabelProps = (value) => ({
      dy: 4,
      dx: -10 - (value.toLocaleString().length || 1) * 5,
    });

    const getTickComponent = (props) => {
      const properties = {
        hiddenLabelRef: this.setHiddenLabelRef,
        categories,
        xBand,
        bandWidth,
        barWidth,
        rotate,
        top,
        defineChart,
        chartingOptions,
        autoFocus,
        onAutoFocusUsed,
        error,
        onChangeCategory,
        changeInteractiveEnabled,
        changeEditableEnabled,
        onChange,
        graphProps,
        x: props.x,
        y: props.y,
        formattedValue: props.formattedValue,
        showCorrectness,
        language,
      };

      return <TickComponent {...properties} />;
    };

    return (
      <StyledAxesGroup ref={(r) => (this.axesNode = r)}>
        {leftAxis && (
          <AxisLeft
            scale={scale.y}
            tickLength={10}
            tickFormat={(value) => value}
            tickValues={rowTickValues}
            tickLabelProps={getTickLabelProps}
          />
        )}
        <AxisBottom
          scale={bottomScale}
          labelProps={{ y: 60 + top }}
          top={scale.y && scale.y(range.min)}
          textLabelProps={() => ({ textAnchor: 'middle' })}
          tickFormat={(count) => count}
          tickComponent={getTickComponent}
          autoFocus={autoFocus}
          onAutoFocusUsed={onAutoFocusUsed}
        />
      </StyledAxesGroup>
    );
  }
}

export default RawChartAxes;
