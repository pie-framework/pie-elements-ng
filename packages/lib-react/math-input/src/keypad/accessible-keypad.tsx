// @ts-nocheck
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import debug from 'debug';
import { flatten } from 'lodash-es';
import MathQuill from '@pie-element/shared-mathquill';
import 'mathquill/build/mathquill.css';
import { color } from '@pie-lib/render-ui';
import { commonMqKeyboardStyles } from '../mq/common-mq-styles';
import { baseSet } from '../keys';
import { getAriaLabel } from './model';
import { sortKeys } from './keys-layout';

const log = debug('pie-lib:math-inline:keypad:a11y');

const KeypadRoot: any = styled('div')(() => ({
  ...commonMqKeyboardStyles,
  width: '100%',
  display: 'grid',
  gridTemplateRows: 'repeat(5, minmax(40px, 60px))',
  gridAutoFlow: 'column',
  border: `1px solid ${color.borderLight()}`,
  '&.character': {
    textTransform: 'initial !important',
    gridTemplateRows: 'repeat(5, minmax(40px, 50px)) !important',
  },
  '&.language': {
    gridTemplateRows: 'repeat(4, minmax(40px, 50px)) !important',
    '& *': {
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif !important',
    },
  },
}));

const KeypadLane: any = styled('div')(({ operator }) => ({
  flex: operator ? '0 0 auto' : '1 1 0',
  display: 'grid',
  gridAutoFlow: 'column',
  gridTemplateRows: 'repeat(5, minmax(44px, 56px))',
  gridAutoColumns: 'minmax(72px, 1fr)',
  backgroundColor: operator ? color.blueGrey300() : color.blueGrey100(),
}));

const TextKey: any = styled(Button, { shouldForwardProp: (prop) => prop !== 'operator' })(({ operator }) => ({
  minWidth: 'auto',
  borderRadius: 0,
  color: color.text(),
  backgroundColor: operator ? color.blueGrey300() : color.blueGrey100(),
  textTransform: 'none',
  fontSize: '1.6rem',
  lineHeight: 1,
  '&:hover': {
    backgroundColor: operator ? color.blueGrey600() : color.blueGrey300(),
  },
  '&:focus-visible': {
    outline: `3px solid ${color.focusCheckedBorder()}`,
    outlineOffset: -3,
    zIndex: 2,
  },
}));

const IconKey: any = styled(IconButton, { shouldForwardProp: (prop) => prop !== 'operator' })(({ operator }) => ({
  minWidth: 'auto',
  borderRadius: 0,
  color: color.text(),
  backgroundColor: operator ? color.blueGrey300() : color.blueGrey100(),
  '&:hover': {
    backgroundColor: operator ? color.blueGrey600() : color.blueGrey300(),
  },
  '&:focus-visible': {
    outline: `3px solid ${color.focusCheckedBorder()}`,
    outlineOffset: -3,
    zIndex: 2,
  },
  '& .icon': {
    height: '30px',
  },
}));

const MathPreviewRoot: any = styled('span')(() => ({
  pointerEvents: 'none',
  color: color.text(),
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 40,
  minWidth: 34,
  '& .MathJax': {
    fontSize: '1.45rem',
    lineHeight: 1.1,
  },
  '& mjx-container': {
    overflow: 'visible !important',
    lineHeight: 1.1,
  },
  '& .tpl-root': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontSize: '1.5rem',
    lineHeight: 1,
    minHeight: 34,
    fontFamily: '"Times New Roman", Times, serif',
    textTransform: 'none',
  },
  '& .mq-keycap': {
    fontFamily: '"STIX Two Text", MJXZERO, MJXTEX, "Times New Roman", Times, serif',
    fontStyle: 'normal',
  },
  '& .mq-keycap var': {
    fontFamily: '"STIX Two Text", MJXZERO, MJXTEX-I, "Times New Roman", Times, serif',
    fontStyle: 'italic',
  },
  '& .mq-keycap .mq-operator-name': {
    fontFamily: '"STIX Two Text", MJXZERO, MJXTEX, "Times New Roman", Times, serif',
    fontStyle: 'normal',
  },
  '& .tpl-fraction': {
    display: 'inline-grid',
    gridTemplateRows: 'auto 1px auto',
    justifyItems: 'center',
    alignItems: 'center',
    minWidth: 22,
  },
  '& .tpl-frac-line': {
    width: '1.05em',
    borderTop: `2px solid ${color.text()}`,
    margin: '2px 0',
  },
  '& .tpl-mixed-fraction': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
  },
  '& .tpl-frac-cell': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '0.55em',
  },
  '& .tpl-placeholder': {
    display: 'inline-block',
    width: '0.42em',
    height: '0.76em',
    backgroundColor: color.secondaryLight(),
  },
  '& .tpl-longdiv': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
  },
  '& .tpl-longdiv-radicand': {
    display: 'inline-flex',
    alignItems: 'center',
    borderTop: `2px solid ${color.text()}`,
    paddingTop: '0.15em',
    minWidth: '0.8em',
    justifyContent: 'center',
  },
  '& .tpl-sup': {
    display: 'inline-flex',
    alignItems: 'flex-start',
  },
  '& .tpl-sup .tpl-placeholder': {
    width: '0.3em',
    height: '0.5em',
    marginLeft: '0.05em',
    transform: 'translateY(-0.35em)',
  },
  '& .tpl-sub': {
    display: 'inline-flex',
    alignItems: 'flex-end',
  },
  '& .tpl-sub .tpl-placeholder': {
    width: '0.3em',
    height: '0.5em',
    marginLeft: '0.05em',
    transform: 'translateY(0.3em)',
  },
  '& .tpl-root-radical': {
    display: 'inline-flex',
    alignItems: 'flex-start',
  },
  '& .tpl-root-sign': {
    fontSize: '1.15em',
    lineHeight: 1,
  },
  '& .tpl-radicand': {
    borderTop: `2px solid ${color.text()}`,
    padding: '0.05em 0 0 0.08em',
    marginLeft: '0.03em',
  },
  '& .tpl-over': {
    display: 'inline-grid',
    justifyItems: 'center',
    gap: 2,
  },
  '& .tpl-over-line': {
    display: 'block',
    width: '1em',
    borderTop: `2px solid ${color.text()}`,
  },
  '& .tpl-over-arrow': {
    display: 'block',
    fontSize: '0.65em',
    lineHeight: 1,
  },
  '& .tpl-over-arc': {
    display: 'block',
    fontSize: '0.8em',
    lineHeight: 1,
    transform: 'translateY(0.1em)',
  },
}));

const MathKey: any = styled(Button, { shouldForwardProp: (prop) => prop !== 'operator' })(({ operator }) => ({
  minWidth: 'auto',
  borderRadius: 0,
  padding: '6px',
  overflow: 'visible',
  textTransform: 'none',
  color: color.text(),
  backgroundColor: operator ? color.blueGrey300() : color.blueGrey100(),
  '&:hover': {
    backgroundColor: operator ? color.blueGrey600() : color.blueGrey300(),
  },
  '&:focus-visible': {
    outline: `3px solid ${color.focusCheckedBorder()}`,
    outlineOffset: -3,
    zIndex: 2,
  },
}));

class LegacyMathquillPreview extends React.Component {
  componentDidMount() {
    this.renderLatex();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.latex !== this.props.latex) {
      this.renderLatex();
    }
  }

  componentWillUnmount() {
    this.field = null;
  }

  renderLatex = () => {
    if (!this.root || typeof window === 'undefined') {
      return;
    }
    if (!this.field) {
      this.field = MathQuill.StaticMath(this.root);
    }
    const normalizedLatex = (this.props.latex || '').replace(/\$\$/g, '').replace(/^\$|\$$/g, '').trim();
    this.field?.latex?.(normalizedLatex);
  };

  render() {
    return <span ref={(r) => (this.root = r)} className="mq-keycap-static" />;
  }
}

LegacyMathquillPreview.propTypes = {
  latex: PropTypes.string.isRequired,
};

const LegacyLatexButtonContent = styled(LegacyMathquillPreview)(({ latex }) => {
  const baseStyles = {
    pointerEvents: 'none',
    textTransform: 'none !important',
    color: color.text(),
    '& .mq-scaled.mq-sqrt-prefix': {
      transform: 'scale(1, 0.9) !important',
    },
    '& .mq-sup-only .mq-sup': {
      marginBottom: '0.9px !important',
    },
    '& .mq-empty': {
      // Use token directly; MUI alpha() cannot parse CSS var() colors.
      backgroundColor: `${color.secondaryLight()} !important`,
    },
    '& .mq-overline .mq-overline-inner': {
      borderTop: `2px solid ${color.text()}`,
    },
    '& .mq-non-leaf.mq-overline': {
      borderTop: 'none !important',
    },
    '& .mq-overarrow': {
      width: '30px',
      marginTop: '0 !important',
      borderTop: `2px solid ${color.text()}`,
      fontFamily: 'Roboto, Helvetica, Arial, sans-serif !important',
    },
    '& .mq-root-block': {
      padding: '5px !important',
    },
    '& .mq-longdiv-inner': {
      borderTop: `1px solid ${color.text()} !important`,
      paddingTop: '1.5px !important',
    },
    '& .mq-overarc': {
      borderTop: `2px solid ${color.text()} !important`,
      '& .mq-overline': {
        borderTop: 'none !important',
      },
      '& .mq-overline-inner': {
        borderTop: 'none !important',
        paddingTop: '0 !important',
      },
    },
  };

  if (latex === '\\parallel') {
    return {
      ...baseStyles,
      fontStyle: 'italic !important',
    };
  }
  return baseStyles;
});

const LATEX_SYMBOL_MAP = {
  '\\theta': 'θ',
  '\\pi': 'π',
  '\\infty': '∞',
  '\\propto': '∝',
  '\\sin': 'sin',
  '\\cos': 'cos',
  '\\tan': 'tan',
  '\\sec': 'sec',
  '\\csc': 'csc',
  '\\cot': 'cot',
  '\\log': 'log',
  '\\ln': 'ln',
  '\\pm': '±',
  '\\approx': '≈',
  '\\napprox': '≉',
  '\\neq': '≠',
  '\\sim': '∼',
  '\\nsim': '≁',
  '\\mu': 'μ',
  '\\Sigma': 'Σ',
  '\\sigma': 'σ',
  '\\parallel': '∥',
  '\\nparallel': '∦',
  '\\perp': '⟂',
  '\\angle': '∠',
  '\\measuredangle': '∡',
  '\\triangle': '△',
  '\\square': '□',
  '\\parallelogram': '▱',
  '\\odot': '⊙',
  '\\degree': '°',
  '\\cong': '≅',
  '\\ncong': '≇',
  '\\leftarrow': '←',
  '\\rightarrow': '→',
  '\\leftrightarrow': '↔',
  '\\le': '≤',
  '\\ge': '≥',
};

const OPERATOR_NAMES = new Set(['\\sin', '\\cos', '\\tan', '\\sec', '\\csc', '\\cot', '\\log', '\\ln']);
const ITALIC_VARS = new Set(['x', 'y', 'i', 'e', 'AB']);

const renderMathToken = (token = '') => {
  if (ITALIC_VARS.has(token)) {
    return <var>{token}</var>;
  }
  return <span>{token}</span>;
};

const renderSymbolNode = (latex = '') => {
  if (OPERATOR_NAMES.has(latex)) {
    return <var className="mq-operator-name">{latex.replace(/^\\/, '')}</var>;
  }
  const mapped = LATEX_SYMBOL_MAP[latex];
  if (mapped) {
    if (ITALIC_VARS.has(mapped)) {
      return <var>{mapped}</var>;
    }
    return <span>{mapped}</span>;
  }
  const normalized = latex
    .replace(/^\\/, '')
    .replace(/\\(left|right)/g, '')
    .replace(/[{}\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return renderMathToken(normalized);
};

const Placeholder = ({ short = false }) => (
  <span className="tpl-placeholder" style={short ? { width: '0.3em', height: '0.55em' } : undefined} />
);

const OverVisual = ({ body, marker }) => (
  <span className="tpl-root tpl-over mq-keycap" aria-hidden>
    <span className={marker}>{marker === 'tpl-over-line' ? '' : marker === 'tpl-over-arrow' ? '↔' : '◠'}</span>
    <span>{body}</span>
  </span>
);

const KeyVisual = ({ definition }) => {
  const latex = definition.key?.latex || '';
  switch (definition.visualType) {
    case 'fractionTemplate':
      if (latex === '\\frac{x}{ }') {
        return (
          <span className="tpl-root mq-keycap" aria-hidden>
            <span className="tpl-fraction">
              <var>x</var>
              <span className="tpl-frac-line" />
              <Placeholder />
            </span>
          </span>
        );
      }
      return (
        <span className="tpl-root mq-keycap" aria-hidden>
          <span className="tpl-fraction">
            <Placeholder />
            <span className="tpl-frac-line" />
            <Placeholder />
          </span>
        </span>
      );
    case 'mixedFractionTemplate':
      return (
        <span className="tpl-root tpl-mixed-fraction mq-keycap" aria-hidden>
          <var>x</var>
          <span className="tpl-fraction" style={{ minWidth: '0.9em' }}>
            <span className="tpl-frac-cell">
              <Placeholder short />
            </span>
            <span className="tpl-frac-line" />
            <span className="tpl-frac-cell">
              <Placeholder short />
            </span>
          </span>
        </span>
      );
    case 'squaredTemplate':
      return (
        <span className="tpl-root tpl-sup mq-keycap" aria-hidden>
          <var>x</var>
          <span style={{ fontSize: '0.7em', transform: 'translateY(-0.25em)' }}>2</span>
        </span>
      );
    case 'longdivTemplate':
      return (
        <span className="tpl-root mq-keycap" aria-hidden>
          <span className="tpl-longdiv">
            <span>)</span>
            <span className="tpl-longdiv-radicand">
              <Placeholder />
            </span>
          </span>
        </span>
      );
    case 'supTemplate':
      return (
        <span className="tpl-root tpl-sup mq-keycap" aria-hidden>
          <var>x</var>
          <Placeholder short />
        </span>
      );
    case 'subTemplate':
      return (
        <span className="tpl-root tpl-sub mq-keycap" aria-hidden>
          <var>x</var>
          <Placeholder short />
        </span>
      );
    case 'sqrtTemplate':
      return (
        <span className="tpl-root tpl-root-radical mq-keycap" aria-hidden>
          <span className="tpl-root-sign">√</span>
          <span className="tpl-radicand">
            <Placeholder />
          </span>
        </span>
      );
    case 'nthRootTemplate':
      return (
        <span className="tpl-root tpl-root-radical mq-keycap" aria-hidden>
          <span style={{ fontSize: '0.55em', transform: 'translate(0.15em,-0.2em)' }}>
            <Placeholder short />
          </span>
          <span className="tpl-root-sign">√</span>
          <span className="tpl-radicand">
            <Placeholder />
          </span>
        </span>
      );
    case 'parenTemplate':
      return (
        <span className="tpl-root mq-keycap" aria-hidden>
          (<Placeholder />)
        </span>
      );
    case 'bracketTemplate':
      return (
        <span className="tpl-root mq-keycap" aria-hidden>
          [<Placeholder />]
        </span>
      );
    case 'absTemplate':
      return (
        <span className="tpl-root mq-keycap" aria-hidden>
          |<Placeholder />|
        </span>
      );
    case 'logSubTemplate':
      return (
        <span className="tpl-root tpl-sub mq-keycap" aria-hidden>
          <var className="mq-operator-name">log</var>
          <Placeholder short />
        </span>
      );
    case 'overlineTemplate':
      return (
        <OverVisual
          body={latex.includes('y') ? <var>y</var> : latex.includes('x') ? <var>x</var> : <Placeholder />}
          marker="tpl-over-line"
        />
      );
    case 'overArrowTemplate':
      return <OverVisual body={<Placeholder />} marker="tpl-over-arrow" />;
    case 'overBiArrowTemplate':
      return <OverVisual body={latex.includes('AB') ? <var>AB</var> : <Placeholder />} marker="tpl-over-arrow" />;
    case 'overArcTemplate':
      return <OverVisual body={<Placeholder />} marker="tpl-over-arc" />;
    case 'symbolText':
      return (
        <span className="tpl-root mq-keycap" aria-hidden>
          {renderSymbolNode(latex)}
        </span>
      );
    default:
      return (
        <span className="tpl-root" aria-hidden>
          {definition.key?.label || definition.key?.write || definition.key?.name}
        </span>
      );
  }
};

const buildOrderedKeys = (baseRows, extraRows, includeBaseSet) => {
  const orderedBase = includeBaseSet ? toColumnMajor(baseRows || []) : [];
  const orderedExtra = toColumnMajor(extraRows || []);
  return [...orderedBase, ...orderedExtra];
};

const flattenGridByColumn = (grid) => {
  if (!grid || !grid.length) {
    return [];
  }
  const rows = grid.length;
  const cols = Math.max(...grid.map((r) => r.length), 0);
  const out = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      out.push(grid[row][col] ?? null);
    }
  }
  return out;
};

const isEmptyKey = (key) => {
  return key && key.name === '' && key.latex === '' && key.write === '';
};

const normalizeInlineLatex = (value = '') => value.replace(/\$\$/g, '').replace(/^\$|\$$/g, '').trim();

const createCustomLayout = (layoutObj) => {
  if (layoutObj) {
    return {
      gridTemplateColumns: `repeat(${layoutObj.columns}, minmax(min-content, 150px))`,
      gridTemplateRows: `repeat(${layoutObj.rows}, minmax(40px, 60px))`,
      gridAutoFlow: 'initial',
    };
  }
  return {};
};

export default class AccessibleKeypad extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    controlledKeypadMode: PropTypes.bool,
    baseSet: PropTypes.array,
    additionalKeys: PropTypes.array,
    layoutForKeyPad: PropTypes.object,
    onPress: PropTypes.func.isRequired,
    onFocus: PropTypes.func,
    noDecimal: PropTypes.bool,
    setKeypadInteraction: PropTypes.func,
    mode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onRequestClose: PropTypes.func,
  };

  static defaultProps = {
    baseSet: baseSet,
    noDecimal: false,
  };

  constructor(props) {
    super(props);
    this.keypadRef = React.createRef();
    this.buttonRefs = [];
    this.state = { activeIndex: 0 };
  }

  componentDidMount() {
    const keyPadElement = this.keypadRef?.current;
    const mainContainer = keyPadElement?.closest('.main-container');
    const currentToolbar = keyPadElement?.closest('.pie-toolbar');
    if (this.props.controlledKeypadMode && mainContainer && currentToolbar) {
      const mainContainerPosition = mainContainer.getBoundingClientRect();
      const currentToolbarPosition = currentToolbar.getBoundingClientRect();
      const difference =
        mainContainerPosition.top + mainContainerPosition.height - (currentToolbarPosition.top + currentToolbarPosition.height);
      if (difference < 0 && mainContainer) {
        mainContainer.style.height = `${mainContainerPosition.height + mainContainerPosition.top - difference}px`;
      }
    }
    if (keyPadElement) {
      keyPadElement.addEventListener('touchstart', this.handleKeypadInteraction, true);
      keyPadElement.addEventListener('mousedown', this.handleKeypadInteraction, true);
    }
  }

  componentWillUnmount() {
    const keyPadElement = this.keypadRef?.current;
    if (this.props.controlledKeypadMode && keyPadElement) {
      const mainContainer = keyPadElement.closest('.main-container');
      if (mainContainer) {
        mainContainer.style.height = 'unset';
      }
    }
    if (keyPadElement) {
      keyPadElement.removeEventListener('touchstart', this.handleKeypadInteraction, true);
      keyPadElement.removeEventListener('mousedown', this.handleKeypadInteraction, true);
    }
  }

  handleKeypadInteraction = () => {
    if (this.props.setKeypadInteraction) {
      this.props.setKeypadInteraction(true);
    }
  };

  keyIsNotAllowed = (key) => {
    const { noDecimal } = this.props;
    return ((key.write === '.' && key.label === '.') || (key.write === ',' && key.label === ',')) && noDecimal;
  };

  flowKeys = (base, extras) => {
    const transposed = [...sortKeys([...(base || []).map((r) => [...r])]), ...sortKeys([...(extras || []).map((r) => [...r])])];
    return flatten(transposed);
  };

  toRenderModel = () => {
    const { baseSet, additionalKeys, mode } = this.props;
    const includeBaseSet = !['non-negative-integers', 'integers', 'decimals', 'fractions', 'item-authoring', 'language'].includes(
      mode,
    );
    const allKeys = includeBaseSet ? this.flowKeys(baseSet, additionalKeys || []) : this.flowKeys([], additionalKeys || []);
    const filtered = allKeys
      .filter((k) => k && !isEmptyKey(k))
      .map((k) =>
        k.latex
          ? {
              ...k,
              latex: normalizeInlineLatex(k.latex),
              write: typeof k.write === 'string' ? normalizeInlineLatex(k.write) : k.write,
              label: typeof k.label === 'string' ? normalizeInlineLatex(k.label) : k.label,
            }
          : k,
      );
    return filtered.map((key, index) => ({
      id: `${key.label || key.latex || key.name || key.command || 'key'}-${index}`,
      ariaLabel: getAriaLabel(key),
      key,
    }));
  };

  pressKey = (definition) => {
    if (!definition || this.keyIsNotAllowed(definition.key)) {
      return;
    }
    log('[pressKey]', definition.id);
    this.props.onPress(definition.key);
  };

  moveFocus = (nextIndex) => {
    const bounded = Math.max(0, Math.min(nextIndex, this.buttonRefs.length - 1));
    this.setState({ activeIndex: bounded }, () => {
      const target = this.buttonRefs[bounded];
      if (target && !target.disabled) {
        target.focus();
      }
    });
  };

  onButtonKeyDown = (event, index) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveFocus(index + 1);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveFocus(index - 1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.moveFocus(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.moveFocus(this.buttonRefs.length - 1);
      return;
    }
    if (event.key === 'Escape' && this.props.onRequestClose) {
      event.preventDefault();
      this.props.onRequestClose();
    }
  };

  renderKey = (definition, index) => {
    const key = definition.key;
    const operator = key.category === 'operators';
    const disabled = this.keyIsNotAllowed(key);
    const common = {
      key: `${definition.id}-${index}`,
      onClick: () => this.pressKey(definition),
      onKeyDown: (e) => this.onButtonKeyDown(e, index),
      onFocus: () => this.setState({ activeIndex: index }),
      tabIndex: this.state.activeIndex === index ? 0 : -1,
      disabled,
      'aria-label': definition.ariaLabel || getAriaLabel(key),
      ...(key.actions || {}),
      ...(key.extraProps || {}),
    };

    if (key.icon) {
      const Icon = key.icon ? key.icon : 'div';
      return (
        <IconKey
          {...common}
          operator={operator}
        >
          <Icon className="icon" aria-hidden="true" />
        </IconKey>
      );
    }

    if (key.latex) {
      return (
        <MathKey
          {...common}
          operator={operator}
        >
          <LegacyLatexButtonContent latex={key.latex} />
        </MathKey>
      );
    }

    return (
      <TextKey
        {...common}
        operator={operator}
      >
        {key.label || key.write || key.name}
      </TextKey>
    );
  };

  render() {
    const { className, onFocus, layoutForKeyPad } = this.props;
    this.buttonRefs = [];
    const items = this.toRenderModel();
    const shift = items.length % 5 ? 1 : 0;
    const style = {
      gridTemplateColumns: `repeat(${Math.floor(items.length / 5) + shift}, minmax(min-content, 150px))`,
      ...createCustomLayout(layoutForKeyPad),
    };
    let indexCounter = 0;
    const renderWithRef = (definition) => {
      const currentIndex = indexCounter++;
      const node = this.renderKey(definition, currentIndex);
      return React.cloneElement(node, {
        ref: (r) => {
          this.buttonRefs[currentIndex] = r;
        },
      });
    };

    return (
      <KeypadRoot
        ref={this.keypadRef}
        className={[className, this.props.mode].filter(Boolean).join(' ')}
        style={style}
        onFocus={onFocus}
        role="grid"
        aria-label="Math keypad"
      >
        {items.map((definition) => renderWithRef(definition))}
      </KeypadRoot>
    );
  }
}
