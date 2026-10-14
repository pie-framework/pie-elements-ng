// @ts-nocheck

import FormControlLabel from '@mui/material/FormControlLabel';
import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import { Feedback as FeedbackImport, color, createUniqueId, PreviewPrompt as PreviewPromptImport } from '@pie-lib/render-ui';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt') || unwrapReactInteropSymbol(renderUi.PreviewPrompt, 'PreviewPrompt');
const Feedback = unwrapReactInteropSymbol(FeedbackImport, 'Feedback') || unwrapReactInteropSymbol(renderUi.Feedback, 'Feedback');
import Radio from '@mui/material/Radio';
import classNames from 'clsx';

import Translator from '@pie-lib/translator';

import FeedbackTick from './feedback-tick.js';

const { translator } = Translator;

/**
 * Whether a choice's label holds content its accessible name cannot carry: browsers leave MathML
 * out of a name, and a table read as a name is a run of cells. Images need nothing, as their alt
 * text is in the name.
 */
export const labelHoldsMathOrTable = (label) =>
  typeof label === 'string' &&
  ['<math', '\\(', '\\[', 'data-latex', 'data-raw', '<mjx-container', '<table'].some((marker) =>
    label.includes(marker),
  );

const CLASS_NAME = 'multiple-choice-component';

const Row: any = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: color.background(),
});

const CheckboxHolder: any = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: color.background(),
  flex: 1,
  '& .MuiFormControlLabel-root': {
    marginLeft: '-14px', // to be consistent to previous versions before MUI v5 upgrade
  },
  '& label': {
    color: color.text(),
    '& > span': {
      fontSize: 'inherit',
    },
    '& > .MuiButtonBase-root': {
      padding: '12px', // to be consistent to previous versions before MUI v5 upgrade
    },
  },
});

const BelowSelectionComponent: any = styled('span')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '& > span': {
    // visually reduce right padding, but maintain accessibility padding for checkbox indicators to be circles
    marginLeft: `-${theme.spacing(1)}`,
  },
}));

const SrOnly: any = styled('span')({
  position: 'absolute',
  left: '-10000px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
});

export const StyledFormControlLabel: any = styled(FormControlLabel)({
  '& .MuiFormControlLabel-label': {
    color: `${color.text()} !important`,
    backgroundColor: color.background(),
    letterSpacing: 'normal',
  },
  '&.Mui-disabled *': {
    cursor: 'not-allowed !important',
  },
});

const colorStyle = (varName, fallback) => ({
  [`&.${CLASS_NAME}`]: {
    color: `var(--choice-input-${varName}, ${fallback}) !important`,
  },
});

const getInputStyles = (correctness) => {
  const key = (k) => (correctness ? `${correctness}-${k}` : k);

  return {
    [key('root')]: {
      ...colorStyle('color', color.text()),
      ...(correctness === 'correct' ? colorStyle('correct-color', color.text()) : {}),
      ...(correctness === 'incorrect' ? colorStyle('incorrect-color', color.incorrect()) : {}),
    },
    [key('checked')]: {
      ...(correctness === 'correct' ? colorStyle('correct-selected-color', color.correct()) : {}),
      ...(correctness === 'incorrect' ? colorStyle('incorrect-checked', color.incorrect()) : {}),
      ...(!correctness ? colorStyle('selected-color', color.primary()) : {}),
    },
    [key('disabled')]: {
      ...colorStyle('disabled-color', color.text()),
      ...(correctness === 'correct' ? colorStyle('correct-disabled-color', color.disabled()) : {}),
      ...(correctness === 'incorrect' ? colorStyle('incorrect-disabled-color', color.disabled()) : {}),
      opacity: 0.6,
      cursor: 'not-allowed !important',
      pointerEvents: 'initial !important',
    },
    focusVisibleUnchecked: {
      outline: `2px solid ${color.focusOutline()}`,
      backgroundColor: 'transparent',
    },
    focusVisibleChecked: {
      outline: `2px solid ${color.focusOutline()}`,
      backgroundColor: 'transparent',
    },
  };
};

const StyledCheckboxBase: any = styled(Checkbox, {
  shouldForwardProp: (prop) => prop !== 'correctness',
})(({ correctness }) => {
  const styles = getInputStyles(correctness);
  const key = (k) => (correctness ? `${correctness}-${k}` : k);

  return {
    [`&.${CLASS_NAME}`]: {
      ...styles[key('root')],
      '&.Mui-checked': styles[key('checked')],
      '&.Mui-disabled': correctness ? {} : styles[key('disabled')],
      '&:hover:not(.Mui-disabled) svg': {
        boxShadow: `0px 0px 0px 2px ${color.focusOutline()}`,
        borderRadius: '4px',
      },
    },
    '&.Mui-focusVisible': {
      '&:not(.Mui-checked)': styles.focusVisibleUnchecked,
      '&.Mui-checked': styles.focusVisibleChecked,
    },
  };
});

export const StyledCheckbox = (props) => {
  const { correctness, checked, onChange, disabled, value, id, onKeyDown, inputRef, ariaLabelledBy } = props;

  const miniProps = { checked, onChange, disabled, value };

  return (
    <StyledCheckboxBase
      id={id}
      slotProps={{ input: { ref: inputRef, 'aria-labelledby': ariaLabelledBy } }}
      onKeyDown={onKeyDown}
      disableRipple
      {...miniProps}
      correctness={correctness}
      className={CLASS_NAME}
    />
  );
};

const StyledRadioBase: any = styled(Radio, {
  shouldForwardProp: (prop) => prop !== 'correctness',
})(({ correctness }) => {
  const styles = getInputStyles(correctness);
  const key = (k) => (correctness ? `${correctness}-${k}` : k);

  return {
    [`&.${CLASS_NAME}`]: {
      ...styles[key('root')],
      '&.Mui-checked': styles[key('checked')],
      '&.Mui-disabled': correctness ? {} : styles[key('disabled')],
      '&.Mui-focusVisible:not(.Mui-checked)': styles.focusVisibleUnchecked,
      '&.Mui-focusVisible.Mui-checked': styles.focusVisibleChecked,
      '&:hover:not(.Mui-disabled) svg': {
        boxShadow: `0px 0px 0px 2px ${color.focusOutline()}`,
        borderRadius: '50%',
      },
    },
    '&.Mui-focusVisible': {
      '& input': { outline: 0 },
      '& .MuiTouchRipple-root': { display: 'none' },
    },
  };
});

export const StyledRadio = (props) => {
  const { correctness, checked, onChange, disabled, value, id, tagName, inputRef, ariaLabelledBy } = props;

  const miniProps = { checked, onChange, disabled, value };

  return (
    <StyledRadioBase
      id={id}
      slotProps={{ input: { ref: inputRef, 'aria-labelledby': ariaLabelledBy } }}
      disableRipple
      {...miniProps}
      correctness={correctness}
      className={CLASS_NAME}
      name={tagName}
    />
  );
};

export class ChoiceInput extends React.Component {
  static propTypes = {
    choiceMode: PropTypes.oneOf(['radio', 'checkbox']),
    displayKey: PropTypes.string,
    checked: PropTypes.bool.isRequired,
    correctness: PropTypes.string,
    disabled: PropTypes.bool.isRequired,
    feedback: PropTypes.string,
    label: PropTypes.string.isRequired,
    rationale: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    className: PropTypes.string,
    tagName: PropTypes.string,
    hideTick: PropTypes.bool,
    isEvaluateMode: PropTypes.bool,
    choicesLayout: PropTypes.oneOf(['vertical', 'grid', 'horizontal']),
    isSelectionButtonBelow: PropTypes.bool,
    language: PropTypes.string,
    spokenMathNames: PropTypes.bool,
  };

  static defaultProps = {
    rationale: null,
    checked: false,
    isEvaluateMode: false,
  };

  constructor(props) {
    super(props);
    this.onToggleChoice = this.onToggleChoice.bind(this);
    this.choiceId = createUniqueId('choice');
    this.descId = `${this.choiceId}-desc`;
    this.noteId = `${this.choiceId}-note`;
  }

  onToggleChoice(event) {
    this.props.onChange(event);
  }

  handleKeyDown: any = (event) => {
    const { choiceMode } = this.props;

    if (choiceMode !== 'checkbox') return;

    const isArrowDown = event.key === 'ArrowDown';
    const isArrowUp = event.key === 'ArrowUp';

    if (!isArrowDown && !isArrowUp) return;

    event.preventDefault();

    const currentEl = document.getElementById(this.choiceId);
    if (!currentEl) return;

    const fieldset = currentEl.closest('fieldset');
    if (!fieldset) return;

    const groupCheckboxes = Array.from(fieldset.querySelectorAll('input[type="checkbox"]'));

    const currentIndex = groupCheckboxes.findIndex((el) => el === currentEl);
    if (currentIndex === -1) return;

    const nextIndex = isArrowDown ? currentIndex + 1 : currentIndex - 1;
    const nextEl = groupCheckboxes[nextIndex];

    if (nextEl) {
      nextEl.focus();
    }
  };

  render() {
    const {
      choiceMode,
      disabled,
      displayKey,
      feedback,
      label,
      correctness,
      className,
      rationale,
      hideTick,
      isEvaluateMode,
      choicesLayout,
      value,
      checked,
      tagName,
      isSelectionButtonBelow,
      language,
      spokenMathNames,
    } = this.props;

    const Tag = choiceMode === 'checkbox' ? StyledCheckbox : StyledRadio;
    const classSuffix = choiceMode === 'checkbox' ? 'checkbox' : 'radio-button';

    const holderSx = {
      ...(choicesLayout === 'horizontal' && {
        [`& .${CLASS_NAME}`]: {
          padding: '8px',
          margin: '4px 0 4px 4px',
        },
      }),
      ...(isSelectionButtonBelow && choicesLayout !== 'grid' && {
        '& > label': {
          alignItems: 'flex-start',
        },
      }),
      ...(isSelectionButtonBelow && choicesLayout === 'grid' && {
        justifyContent: 'center',
        '& > label': {
          alignItems: 'center',
        },
      }),
    };

    // By default a lettered choice holding math is named from its key and a note that the answer
    // follows, "A. Pick the answer below", so the screen reader reads its MathML in the content
    // rather than a name that drops it. Spoken math names, which the Player opts into, name it from
    // its label, math labelled with its speech; so does a choice with no key to name it by (PIE-1244).
    const namedByNote = Boolean(displayKey) && !spokenMathNames && labelHoldsMathOrTable(label);

    const screenReaderLabel = displayKey ? (
      <SrOnly id={this.descId} className="pie-sr-only">
        {namedByNote ? `${displayKey}.` : displayKey}
      </SrOnly>
    ) : null;

    const note = namedByNote ? (
      <SrOnly id={this.noteId} className="pie-sr-only">
        {translator.t('multipleChoice.pickTheAnswerBelow', { lng: language })}
      </SrOnly>
    ) : null;

    const choicelabel = (
      <>
        {displayKey && !isSelectionButtonBelow ? (
          <Row component="span">
            <span aria-hidden="true">{displayKey}.{'\u00A0'}</span>
            <PreviewPrompt className="prompt-label" prompt={label} tagName="span" />
          </Row>
        ) : (
          <PreviewPrompt className="prompt-label" prompt={label} tagName="span" />
        )}
      </>
    );

    const tagProps = {
      disabled,
      checked,
      correctness,
      tagName,
      value,
      id: this.choiceId,
      onChange: this.onToggleChoice,
      onKeyDown: this.handleKeyDown,
      ariaLabelledBy: namedByNote ? `${this.descId} ${this.noteId}` : undefined,
    };

    const control = isSelectionButtonBelow ? (
      <BelowSelectionComponent>
        {screenReaderLabel}
        {note}
        <Tag {...tagProps} style={{ padding: 0 }} />
        <span aria-hidden="true">{displayKey ? `${displayKey}.` : ''}</span>
      </BelowSelectionComponent>
    ) : (
      <>
        {screenReaderLabel}
        {note}
        <Tag {...tagProps} />
      </>
    );

    return (
      <div className={classNames(className, 'corespring-' + classSuffix, 'choice-input')}>
        <Row>
          {!hideTick && isEvaluateMode && <FeedbackTick correctness={correctness} />}
          <CheckboxHolder className="checkbox-holder" sx={holderSx}>
            <StyledFormControlLabel
              label={choicelabel}
              value={value}
              htmlFor={this.choiceId}
              labelPlacement={isSelectionButtonBelow ? 'top' : undefined}
              control={control}
            />
          </CheckboxHolder>
        </Row>
        {rationale && <PreviewPrompt className="rationale" defaultClassName="rationale" prompt={rationale} />}
        <Feedback feedback={feedback} correctness={correctness} />
      </div>
    );
  }
}

export default ChoiceInput;
