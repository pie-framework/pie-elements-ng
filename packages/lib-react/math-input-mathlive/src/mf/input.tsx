// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import debug from 'debug';
import {
  loadMathLive,
  createMathField,
  MATH_MODE_SPACE,
  applyShadowStyles,
  trackPlaceholderCaret,
} from '../mathlive-instance.js';
import { describeMathField, labelMathField } from './field-label.js';
import { toMathLive, fromMathLive, keyToAction, KEYSTROKES } from '../latex-bridge.js';
import { trackWholeAtomSelection } from '../selection.js';
import { trackLongDivision } from '../longdiv.js';
import { keepCaretWhileKeypadFocused } from './inactive-caret.js';

// MathLive's Tab and Shift+Tab group navigation. Tab still accepts a suggestion while a latex
// command is typed (`ifMode: 'latex'`).
const TAB_NAVIGATION = new Set(['[Tab]', 'shift+[Tab]']);

const withoutTabNavigation = (keybindings = []) =>
  keybindings.filter(({ key, ifMode }) => !(TAB_NAVIGATION.has(key) && ifMode !== 'latex'));

const log = debug('pie-lib:math-input-mathlive:input');

// A whole number, a space, then a fraction with an empty denominator, as MathLive
// serialises it (the empty slot is `\placeholder{}`).
const MIXED_NUMBER_SPACE_REGEX = /([0-9])\\ (\\frac\{[^{}]*\}\{(?:\\placeholder\{\})?\})/;

const Holder = styled('span')({
  display: 'inline-block',
  '& math-field': {
    display: 'block',
    width: '100%',
  },
  // MathLive ships its own virtual keyboard toggle; pie supplies its own keypad.
  '& math-field::part(virtual-keyboard-toggle)': {
    display: 'none',
  },
  '& math-field::part(menu-toggle)': {
    display: 'none',
  },
});

/**
 * Editable math field. Drop-in replacement for @pie-lib/math-input's `mq.Input`.
 *
 * Keeps the same imperative surface used by MathInput's keypad
 * (`write`, `command`, `keystroke`, `clear`, `focus`, `blur`) so callers do not
 * change, and the same `latex` / `onChange` props.
 */
export class Input extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    latex: PropTypes.string,
    onChange: PropTypes.func,
    onClick: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    language: PropTypes.string,
    ariaDescribedBy: PropTypes.string,
    readOnly: PropTypes.bool,
    innerRef: PropTypes.func,
  };

  /** Renames the field once the language's catalog lands, for an element that did not preload it. */
  relabel = () => labelMathField(this.mathField, this.props.language);

  constructor(props) {
    super(props);
    this.holderRef = React.createRef();
    // Tracks the last latex we emitted, so prop echoes don't reset the cursor.
    this.lastEmitted = undefined;
  }

  async componentDidMount() {
    // MathLive loads asynchronously, so this method resumes after an await and
    // has to know whether it is still the current mount. React StrictMode calls
    // mount -> unmount -> mount on the SAME instance in dev, so a boolean
    // "unmounted" flag would latch and block the remount from ever creating a
    // field. A generation counter identifies the live mount instead: only the
    // newest one proceeds, and a real unmount invalidates all pending ones.
    const generation = (this.mountGeneration = (this.mountGeneration || 0) + 1);
    const ml = await loadMathLive();

    if (generation !== this.mountGeneration || !ml?.MathfieldElement || !this.holderRef.current || this.mathField) {
      return;
    }

    this.mathField = createMathField(ml);
    labelMathField(this.mathField, this.props.language, this.relabel);
    describeMathField(this.mathField, this.props.ariaDescribedBy);
    this.mathField.value = toMathLive(this.props.latex || '');

    if (this.props.readOnly) {
      this.mathField.readOnly = true;
    }

    // pie drives input through its own keypad, so suppress MathLive's.
    this.mathField.mathVirtualKeyboardPolicy = 'manual';
    // Without this the spacebar does nothing: MathLive's mathModeSpace
    // defaults to an empty string.
    this.mathField.mathModeSpace = MATH_MODE_SPACE;
    // After the exponent key the cursor must stay in the exponent until it is moved
    // MathLive's `smartSuperscript` (on by
    // default) jumps out of an empty superscript after a single digit, which breaks
    // typing x^23 or 10^6 and is inconsistent with non-digit exponents.
    this.mathField.smartSuperscript = false;

    // The mathfield renders in shadow DOM, so page CSS cannot reach it - the
    // stretchy-accent fix has to be injected there directly.
    applyShadowStyles(this.mathField);

    // A selected `\placeholder{}` gets no MathLive caret; draw one.
    this.untrackCaret = trackPlaceholderCaret(this.mathField);

    // Shift+Arrow would otherwise select half a fraction; snap to whole atoms.
    this.untrackSelection = trackWholeAtomSelection(this.mathField);

    // MathLive misdraws long division; correct it after every render.
    this.untrackLongDivision = trackLongDivision(this.mathField);

    // MathLive hides the caret on blur; keep it while a keypad button has focus.
    this.stopKeepingCaret = keepCaretWhileKeypadFocused(this.mathField);

    this.mathField.addEventListener('input', this.onInputEdit);

    // Belt and braces: drop anything a previous mount may have left behind.
    this.holderRef.current.replaceChildren(this.mathField);
    // Its keyboard input only exists now that it is connected.
    labelMathField(this.mathField, this.props.language, this.relabel);
    // Tab moves focus on, keeping the insertion point, so a keypad button can insert there.
    // MathLive's own Tab first walks the cursor through the expression's groups to its end. The
    // keybindings can only be read once the field is connected.
    this.mathField.keybindings = withoutTabNavigation(this.mathField.keybindings);

    if (this.props.innerRef) {
      this.props.innerRef(this);
    }

    if (this.pendingFocus) {
      this.pendingFocus = false;
      this.mathField.focus();
    }
  }

  componentDidUpdate(prevProps) {
    if (!this.mathField) {
      return;
    }

    const { latex, readOnly, language } = this.props;

    if (language !== prevProps.language) {
      labelMathField(this.mathField, language, this.relabel);
    }

    if (this.props.ariaDescribedBy !== prevProps.ariaDescribedBy) {
      describeMathField(this.mathField, this.props.ariaDescribedBy);
    }

    if (readOnly !== prevProps.readOnly) {
      this.mathField.readOnly = !!readOnly;
    }

    // Only push the prop back into the field when it genuinely differs from
    // what the field already holds. This is the analogue of the old
    // shouldComponentUpdate latex-equality guard and prevents cursor thrash.
    if (latex !== undefined && latex !== null && latex !== this.lastEmitted) {
      const next = toMathLive(latex);

      if (next !== this.mathField.value) {
        this.mathField.value = next;
      }
    }
  }

  componentWillUnmount() {
    // Invalidate any mount still awaiting the MathLive load, so it does not
    // append a field into a holder that is going away.
    this.mountGeneration = (this.mountGeneration || 0) + 1;

    if (this.untrackCaret) {
      this.untrackCaret();
      this.untrackCaret = undefined;
    }

    if (this.untrackSelection) {
      this.untrackSelection();
      this.untrackSelection = undefined;
    }

    if (this.untrackLongDivision) {
      this.untrackLongDivision();
      this.untrackLongDivision = undefined;
    }

    if (this.stopKeepingCaret) {
      this.stopKeepingCaret();
      this.stopKeepingCaret = undefined;
    }

    if (this.mathField) {
      this.mathField.removeEventListener('input', this.onInputEdit);
      this.mathField.remove();
      this.mathField = undefined;
    }

    if (this.props.innerRef) {
      this.props.innerRef(null);
    }
  }

  onInputEdit = () => {
    const { onChange } = this.props;

    if (!this.mathField) {
      return;
    }

    const latex = fromMathLive(this.mathField.getValue('latex'));

    this.lastEmitted = latex;

    if (onChange) {
      onChange(latex);
    }
  };

  /** Current latex, in stored (MathQuill-compatible) form. */
  latex() {
    return this.mathField ? fromMathLive(this.mathField.getValue('latex')) : '';
  }

  /**
   * The underlying `<math-field>` element, or undefined until MathLive has
   * finished loading. Exposed for callers that need the real element.
   *
   * NOTE: this is NOT a MathQuill field. Code written against
   * `@pie-lib/math-input` often did `input.mathField.latex()`; that shape is
   * provided by `mqCompat` below, and `latex()` on this component is the
   * supported replacement.
   */
  get element() {
    return this.mathField;
  }

  /**
   * MathQuill-shaped facade, so existing `input.mathField.latex()` /
   * `.el()` call sites keep working instead of throwing. Only the members that
   * consumers actually used are provided; MathQuill internals such as
   * `__controller` have no MathLive equivalent and are deliberately absent.
   */
  get mqCompat() {
    return {
      latex: (v) => (v === undefined ? this.latex() : (this.setLatex(v), v)),
      el: () => this.mathField,
      focus: () => this.focus(),
      blur: () => this.blur(),
    };
  }

  /** Programmatically replace the content. */
  setLatex(v) {
    if (this.mathField) {
      this.mathField.value = toMathLive(v || '');
    }
  }

  clear() {
    if (this.mathField) {
      this.mathField.value = '';
      // Setting `value` fires no input event, so report the change here.
      this.onInputEdit();
    }

    return '';
  }

  /**
   * Join a mixed number that was typed with a space (PD-1858).
   *
   * Typing `1`, space, `2`, `/` gives `1\ \frac{2}{}`: `/` takes only the digits
   * after the space as the numerator. The whole number belongs right next to
   * the fraction, so the space is removed, keeping the caret in the empty
   * denominator.
   *
   * @returns {boolean} whether the latex changed
   */
  joinMixedNumber() {
    if (!this.mathField) {
      return false;
    }

    const value = this.mathField.getValue('latex');
    const next = value.replace(MIXED_NUMBER_SPACE_REGEX, '$1$2');

    if (next === value) {
      return false;
    }

    // The space is one atom before the caret, so every offset shifts by one.
    const { ranges, direction } = this.mathField.selection;

    this.mathField.value = next;
    this.mathField.selection = { ranges: ranges.map(([start, end]) => [start - 1, end - 1]), direction };
    this.onInputEdit();

    return true;
  }

  blur() {
    log('blur mathfield');
    this.pendingFocus = false;
    this.mathField && this.mathField.blur();
  }

  focus() {
    log('focus mathfield...');

    if (!this.mathField) {
      // MathLive is still loading: focus the field once it is mounted.
      this.pendingFocus = true;
      return;
    }

    this.mathField.focus();
  }

  /**
   * MathQuill `cmd()` equivalent.
   *
   * Callers pass MathQuill command names (`'\\frac'`, `'\\sqrt'`, `'^'`, or an
   * array of them). Those must be expanded into latex with `#?` placeholders,
   * otherwise inserting a bare `\frac` produces no editable slots.
   */
  command(v) {
    log('command: ', v);

    if (!this.mathField) {
      return '';
    }

    const action = keyToAction({ command: v });

    if (action) {
      this.mathField.insert(action.value, { focus: true });
    }

    this.mathField.focus();

    return this.latex();
  }

  /**
   * MathQuill `keystroke()` equivalent.
   *
   * Accepts MathQuill keystroke names (`'Left'`, `'Right'`, `'Backspace'`) as
   * the keypad emits them, and passes anything else through as a MathLive
   * selector.
   */
  keystroke(v) {
    log('keystroke: ', v);

    if (!this.mathField) {
      return '';
    }

    const selector = KEYSTROKES[v] || v;

    try {
      this.mathField.executeCommand(selector);
    } catch (e) {
      log('unknown keystroke/selector "%s": %s', v, e && e.message);
    }

    this.mathField.focus();

    return this.latex();
  }

  /** MathQuill `write()` equivalent. Accepts an array, as `cmd()` did. */
  write(v) {
    log('write: ', v);

    if (!this.mathField) {
      return '';
    }

    const values = Array.isArray(v) ? v : [v];

    values.forEach((vv) => this.mathField.insert(vv, { focus: true }));
    this.mathField.focus();

    return this.latex();
  }

  /**
   * Enter must not insert a line break: math input is single-expression, and
   * the MathQuill version swallowed charCode 13 for the same reason. Newlines
   * are authored explicitly through the newLine embed, not the Enter key.
   */
  onKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  render() {
    const { className, onFocus, onBlur, onClick } = this.props;

    return (
      <Holder
        className={className}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onClick}
        onKeyDown={this.onKeyDown}
        ref={this.holderRef}
      />
    );
  }
}

export default Input;
