// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import debug from 'debug';
import {
  loadMathLive,
  createMathField,
  latexToMarkup,
  latexToMathMl,
  MATH_MODE_SPACE,
  applyShadowStyles,
  trackPlaceholderCaret,
} from '../mathlive-instance.js';
import { trackLongDivision, fixLongDivisionWhenReady } from '../longdiv.js';
import { keepCaretWhileKeypadFocused } from './inactive-caret.js';
import { describeMathField, labelMathField } from './field-label.js';
import {
  toMathLive,
  fromMathLive,
  fieldIds,
  fieldTemplate,
  fieldValues,
  fillFields,
  keyToAction,
  KEYSTROKES,
} from '../latex-bridge.js';
import { placeholderStyles, rootIndexStyles, parallelStyles } from './common-styles.js';

const log = debug('pie-lib:math-input-mathlive:static');

// Visually hidden, still read: the text alternative of display markup.
const SR_ONLY =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';

const Holder = styled('span')({
  display: 'inline-block',
  // Shared static-math rules: muted empty-slot glyphs and svg containment.
  ...placeholderStyles,
  // Readable radical index - display mode renders in the light DOM, so the
  // shadow-root copy of this rule does not reach it.
  ...rootIndexStyles,
  ...parallelStyles,
  '& math-field': {
    display: 'inline-block',
    border: 'none',
    background: 'transparent',
  },
  '& math-field::part(virtual-keyboard-toggle)': {
    display: 'none',
  },
  '& math-field::part(menu-toggle)': {
    display: 'none',
  },
});

/**
 * Static math. Drop-in replacement for @pie-lib/math-input's `mq.Static`.
 *
 * Two modes, chosen automatically:
 *
 *  - **display** (no answer blocks in the latex): rendered with
 *    `convertLatexToMarkup`. No mathfield instance, so it is cheap enough for
 *    keypad labels - the old implementation created a full MathQuill
 *    StaticMath per button.
 *
 *  - **interactive** (latex contains `\MathQuillMathField[..]{}` /
 *    `\placeholder[..]{}`): a read-only `<math-field>` whose placeholders stay
 *    editable. Sub-field values are surfaced through the prompts API, replacing
 *    MathQuill's `innerFields`.
 */
export default class Static extends React.Component {
  static propTypes = {
    latex: PropTypes.string.isRequired,
    className: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    language: PropTypes.string,
    ariaDescribedBy: PropTypes.string,
    getFieldName: PropTypes.func,
    onSubFieldChange: PropTypes.func,
    onSubFieldFocus: PropTypes.func,
    setInput: PropTypes.func,
  };

  static defaultProps = {
    getFieldName: () => {},
  };

  /** Renames the field once the language's catalog lands, for an element that did not preload it. */
  relabel = () => labelMathField(this.mathField, this.props.language);

  constructor(props) {
    super(props);
    this.holderRef = React.createRef();
    this.state = { markup: '' };
    this.promptValues = {};
  }

  componentDidMount() {
    this.mount();
  }

  /** Render display markup, or mount a live field when the latex has answer blocks. */
  async mount() {
    // See the note in mf/input.jsx: a generation counter, not a boolean, so a
    // StrictMode mount -> unmount -> mount on the same instance still ends up
    // with exactly one field.
    const generation = (this.mountGeneration = (this.mountGeneration || 0) + 1);

    this.interactive = this.isInteractive();

    if (!this.interactive) {
      await loadMathLive();

      if (generation === this.mountGeneration) {
        this.renderMarkup();
      }

      return;
    }

    const ml = await loadMathLive();

    if (generation !== this.mountGeneration || !ml?.MathfieldElement || !this.holderRef.current || this.mathField) {
      return;
    }

    this.mathField = createMathField(ml);
    labelMathField(this.mathField, this.props.language, this.relabel);
    describeMathField(this.mathField, this.props.ariaDescribedBy);
    this.mathField.readOnly = true;
    this.mathField.mathVirtualKeyboardPolicy = 'manual';
    // Without this the spacebar does nothing: MathLive's mathModeSpace
    // defaults to an empty string.
    this.mathField.mathModeSpace = MATH_MODE_SPACE;
    // Same as the editor: stay in the exponent after a digit (see mf/input.jsx).
    this.mathField.smartSuperscript = false;
    this.mathField.value = toMathLive(this.props.latex);

    // The mathfield renders in shadow DOM, so page CSS cannot reach it - the
    // stretchy-accent fix has to be injected there directly.
    applyShadowStyles(this.mathField);

    // A selected `\placeholder{}` gets no MathLive caret; draw one. Answer
    // blocks are typed into with the same keypad, so they grow placeholders too.
    this.untrackCaret = trackPlaceholderCaret(this.mathField);

    // MathLive misdraws long division; correct it after every render.
    this.untrackLongDivision = trackLongDivision(this.mathField);

    // MathLive hides the caret on blur; keep it in the answer block while a keypad button has focus.
    this.stopKeepingCaret = keepCaretWhileKeypadFocused(this.mathField);

    this.mathField.addEventListener('input', this.onPromptInput);
    // Capture: MathLive handles the pointer inside its shadow root and stops it there.
    this.mathField.addEventListener('pointerdown', this.onPointerDown, true);
    this.mathField.addEventListener('focusin', this.onPromptFocus);
    this.mathField.addEventListener('selection-change', this.onSelectionChange);
    this.mathField.addEventListener('keydown', this.onKeyDown);

    // Belt and braces: drop anything a previous mount may have left behind.
    this.holderRef.current.replaceChildren(this.mathField);
    // Its keyboard input only exists now that it is connected, and connecting resets the caret.
    labelMathField(this.mathField, this.props.language, this.relabel);
    this.parkCaret();

    this.createLiveRegion();
  }

  componentDidUpdate(prevProps, prevState) {
    // Display mode: new markup was just written into the DOM.
    if (!this.mathField && this.state.markup !== (prevState && prevState.markup)) {
      fixLongDivisionWhenReady(this.holderRef.current);
    }

    if (this.mathField && prevProps.language !== this.props.language) {
      labelMathField(this.mathField, this.props.language, this.relabel);
    }

    if (this.mathField && prevProps.ariaDescribedBy !== this.props.ariaDescribedBy) {
      describeMathField(this.mathField, this.props.ariaDescribedBy);
    }

    if (prevProps.latex === this.props.latex) {
      return;
    }

    // Answer blocks came or went (a gather view switching to view or evaluate, or
    // back), so the other kind of rendering is needed.
    if (this.isInteractive() !== this.interactive) {
      this.unmountField();
      this.setState({ markup: '' });
      this.mount();
      return;
    }

    if (!this.mathField) {
      this.renderMarkup();
    } else if (fieldTemplate(this.props.latex) === fieldTemplate(prevProps.latex)) {
      this.syncPrompts();
    } else {
      this.mathField.value = toMathLive(this.props.latex);
      this.parkCaret();
    }
  }

  /**
   * Put the caret at the start of the first answer block, without focusing.
   *
   * Setting `value` leaves the caret at the end, after every block. When the field
   * then takes focus from Tab, MathLive looks for the next block after the caret,
   * finds none, and moves focus on to the next element on the page: Tab skipped
   * the field. With the caret in a block, MathLive leaves focus where it is.
   */
  parkCaret() {
    if (!this.mathField || this.mathField.hasFocus?.()) {
      return;
    }

    const [first] = this.mathField.getPrompts?.() || [];
    const range = first && this.mathField.getPromptRange(first);

    if (range) {
      this.mathField.selection = { ranges: [[range[0], range[0]]] };
    }
  }

  /**
   * Put answers from the latex prop into their prompts, leaving alone any the
   * field reported itself: the prop is usually the parent echoing the last
   * `onSubFieldChange`, and reassigning the field moves the caret out of the
   * prompt, so the next keys typed would be lost.
   */
  syncPrompts() {
    const values = fieldValues(this.props.latex);

    Object.keys(values).forEach((id) => {
      const value = values[id];

      if (value === this.promptValues[id] || value === fromMathLive(this.mathField.getPromptValue(id))) {
        return;
      }

      this.mathField.setPromptValue(id, toMathLive(value), {});
      this.promptValues[id] = value;
    });
  }

  componentWillUnmount() {
    this.unmountField();
    this.removeLiveRegion();
  }

  /** Remove the live field, if any, and invalidate any mount still awaiting the MathLive load. */
  unmountField() {
    this.mountGeneration = (this.mountGeneration || 0) + 1;

    if (this.untrackCaret) {
      this.untrackCaret();
      this.untrackCaret = undefined;
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
      this.mathField.removeEventListener('input', this.onPromptInput);
      this.mathField.removeEventListener('pointerdown', this.onPointerDown, true);
      this.mathField.removeEventListener('focusin', this.onPromptFocus);
      this.mathField.removeEventListener('selection-change', this.onSelectionChange);
      this.mathField.removeEventListener('keydown', this.onKeyDown);
      this.mathField.remove();
      this.mathField = undefined;
    }

    this.promptValues = {};
    this.focusedPrompt = undefined;
  }

  /**
   * Off-screen aria-live region, ported from @pie-lib/math-input's Static.
   *
   * MathLive has its own accessibility layer, but it does not announce that
   * typed input was converted into a math symbol, which screen-reader users
   * relied on in the MathQuill implementation.
   */
  createLiveRegion = () => {
    if (typeof document === 'undefined' || this.liveRegion) {
      return;
    }

    this.liveRegion = document.createElement('div');
    Object.assign(this.liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      marginTop: '-1px',
      clip: 'rect(1px, 1px, 1px, 1px)',
      overflow: 'hidden',
    });
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');

    document.body.appendChild(this.liveRegion);
  };

  removeLiveRegion = () => {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }

    this.liveRegion = undefined;
  };

  announce = (message) => {
    if (!this.liveRegion) {
      return;
    }

    this.liveRegion.textContent = message;

    // Clear once announced, so the same message can be announced again.
    clearTimeout(this.announceTimeout);
    this.announceTimeout = setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 500);
  };

  onKeyDown = (event) => {
    // Deletions should not be announced as conversions.
    this.isDeleting = event?.key === 'Backspace' || event?.key === 'Delete';
  };

  /**
   * Announce when typed input became a math symbol. The MathQuill version
   * inferred this by counting braces; here a prompt whose latex grew by more
   * than the single character typed means a command was expanded.
   */
  announceConversion = (next) => {
    if (this.isDeleting) {
      this.isDeleting = false;
      return;
    }

    const converted = Object.keys(next).some((id) => {
      const before = this.promptValues[id] || '';
      const after = next[id] || '';

      return after.length > before.length + 1 && /\\/.test(after.slice(before.length));
    });

    if (converted) {
      this.announce('Converted to math symbol');
    }
  };

  /** Does this latex contain answer blocks? */
  isInteractive() {
    const latex = this.props.latex || '';

    return fieldIds(latex).length > 0 || latex.indexOf('\\placeholder') !== -1;
  }

  renderMarkup() {
    const visual = latexToMarkup(this.props.latex);
    const mathMl = visual && latexToMathMl(this.props.latex);
    // Static markup reads as its glyphs in DOM order, so it is hidden from
    // assistive technology in favour of MathML, as MathLive's own <math-span> does.
    const markup = mathMl ? `<span aria-hidden="true">${visual}</span><span style="${SR_ONLY}">${mathMl}</span>` : visual;

    if (markup !== this.state.markup) {
      this.setState({ markup });
    }
  }

  /** MathQuill's `innerFields` equivalent, keyed by prompt id. */
  values() {
    if (!this.mathField) {
      return {};
    }

    const out = {};

    (this.mathField.getPrompts() || []).forEach((id) => {
      out[id] = fromMathLive(this.mathField.getPromptValue(id));
    });

    return out;
  }

  /** The whole field's latex, in stored form. MathQuill's `mathField.latex()`. */
  latex() {
    // The stored latex with the current answers: rebuilt from the prop rather than
    // read back from MathLive, so everything outside the answers is kept as stored.
    return this.mathField ? fillFields(this.props.latex, this.values()) : '';
  }

  /** Put the selection inside prompt `id`, unless it is there already, so edits land in it. */
  selectPrompt(id) {
    if (this.promptContaining(this.mathField.position) !== id) {
      this.focusPrompt(id);
    }
  }

  /**
   * A MathQuill-inner-field-like handle for a prompt.
   *
   * The old API handed callers a MathQuill field object: consumers called
   * `field.latex()` on it, and drove it from a keypad with `write()`, `cmd()`,
   * `keystroke()` and `clear()`. There is no equivalent object in MathLive -
   * prompts are addressed by id - so this adapter exposes those parts. Edits go
   * through the field, which reports them with its `input` event as typing does.
   */
  promptHandle(id) {
    const edit = (fn) => {
      if (this.mathField) {
        this.selectPrompt(id);
        fn(this.mathField);
      }
    };

    return {
      id,
      write: (value) =>
        edit((mf) => (Array.isArray(value) ? value : [value]).forEach((v) => mf.insert(v, { focus: true }))),
      cmd: (value) =>
        edit((mf) => {
          const action = keyToAction({ command: value });

          if (action) {
            mf.insert(action.value, { focus: true });
          }
        }),
      keystroke: (value) =>
        edit((mf) => {
          try {
            mf.executeCommand(KEYSTROKES[value] || value);
          } catch (e) {
            log('unknown keystroke/selector "%s": %s', value, e && e.message);
          }
        }),
      clear: () =>
        edit((mf) => {
          mf.setPromptValue(id, '', {});
          // Setting a prompt programmatically fires no input event.
          this.onPromptInput();
        }),
      // MathQuill's inner fields could be focused directly; keep that. A caret
      // already inside the prompt stays where it is, so a keypad edit followed
      // by focus() keeps typing at the same place.
      focus: () => {
        if (this.mathField) {
          this.mathField.focus();
          this.selectPrompt(id);
        }
      },
      el: () => this.mathField,
      latex: (value) => {
        if (!this.mathField) {
          return '';
        }

        if (value === undefined) {
          return fromMathLive(this.mathField.getPromptValue(id));
        }

        this.mathField.setPromptValue(id, toMathLive(value), {});

        return value;
      },
    };
  }

  /** All prompt handles, the analogue of `mathField.innerFields`. */
  get innerFields() {
    if (!this.mathField) {
      return [];
    }

    return (this.mathField.getPrompts() || []).map((id) => this.promptHandle(id));
  }

  onPromptInput = () => {
    const { onSubFieldChange, getFieldName } = this.props;

    if (!this.mathField) {
      return;
    }

    const next = this.values();

    this.announceConversion(next);

    if (!onSubFieldChange) {
      this.promptValues = next;
      return;
    }

    const fields = this.innerFields;

    // Emit only the prompts whose value actually changed, mirroring the
    // per-field granularity of the old onSubFieldChange(name, latex).
    Object.keys(next).forEach((id) => {
      if (next[id] === this.promptValues[id]) {
        return;
      }

      const name = getFieldName(this.promptHandle(id), fields) || id;

      onSubFieldChange(name, next[id]);
    });

    this.promptValues = next;
  };

  onPointerDown = () => {
    // MathLive puts the caret where the pointer is; focusin must not move it.
    this.pointerFocus = true;
  };

  onPromptFocus = () => {
    const pointer = this.pointerFocus;

    this.pointerFocus = false;

    if (!this.mathField) {
      return;
    }

    // Focus from the keyboard (Tab) leaves the caret outside every prompt, where
    // nothing can be typed: start in the first answer block.
    if (!pointer && !this.promptContaining(this.caretOffset())) {
      this.focusPrompt();
    }

    this.reportFocusedPrompt(true);
  };

  // The caret moving to another answer block (a click, Tab, an arrow key) fires
  // no new focusin, since the blocks share one field.
  onSelectionChange = () => {
    // Only a caret the student moves: placing it without focus (see parkCaret) is no focus.
    if (this.mathField?.hasFocus?.()) {
      this.reportFocusedPrompt(false);
    }
  };

  /**
   * Tell the parent which answer block has the caret, through `setInput` and
   * `onSubFieldFocus`, so keypad input goes to that block.
   *
   * @param {boolean} always report even when it is the block reported last
   */
  reportFocusedPrompt(always) {
    const { onSubFieldFocus, getFieldName } = this.props;

    if (!this.mathField || !onSubFieldFocus) {
      return;
    }

    try {
      const focused = this.promptContaining(this.caretOffset());

      if (!focused || (!always && focused === this.focusedPrompt)) {
        return;
      }

      this.focusedPrompt = focused;

      const handle = this.promptHandle(focused);
      const name = getFieldName(handle, this.innerFields) || focused;

      if (this.props.setInput) {
        this.props.setInput(handle);
      }

      onSubFieldFocus(name, handle);
    } catch (e) {
      log('error resolving focused prompt: %s', e.message);
    }
  }

  /** Where the selection starts, which is the caret when nothing is selected. */
  caretOffset() {
    const selection = this.mathField?.selection;

    return selection?.ranges?.length ? selection.ranges[0][0] : this.mathField?.position;
  }

  /** The id of the prompt whose range contains `position`, if any. */
  promptContaining(position) {
    if (!this.mathField || typeof position !== 'number') {
      return undefined;
    }

    return (this.mathField.getPrompts() || []).find((id) => {
      const range = this.mathField.getPromptRange(id);

      return range && position >= range[0] && position <= range[1];
    });
  }

  /**
   * Put a blinking caret inside an answer block.
   *
   * MathLive only makes the caret visible while the field element carries the
   * `ML__focused` class, and it adds that class during a *render*, gated on
   * `isSelectionEditable && hasFocus()`. In a read-only field only prompt
   * interiors are editable, so the two things both have to be true:
   *
   *  - the selection must sit inside a prompt, and
   *  - a render must run afterwards.
   *
   * Assigning `selection` satisfies the first but not the second - it updates
   * the model without re-rendering, so the class stays off and the caret span
   * remains `visibility: hidden`. Executing any command does trigger the
   * render, and `scrollIntoView` is the one with no other effect: it keeps the
   * caret on screen, which the preceding `focus()` already does anyway.
   *
   * @param {string} [id] prompt to focus; defaults to the first one
   */
  focusPrompt(id) {
    if (!this.mathField) {
      return;
    }

    const ids = this.mathField.getPrompts() || [];
    const target = id && ids.indexOf(id) !== -1 ? id : ids[0];

    if (!target) {
      return;
    }

    const range = this.mathField.getPromptRange(target);

    if (!range) {
      return;
    }

    this.mathField.selection = { ranges: [[range[0], range[0]]] };

    if (typeof this.mathField.executeCommand === 'function') {
      this.mathField.executeCommand('scrollIntoView');
    }
  }

  focus() {
    if (!this.mathField) {
      return;
    }

    this.mathField.focus();

    // A bare focus() leaves the selection outside every prompt, which in a
    // read-only field is not editable - the block looked focused but had no
    // cursor. Clicking a prompt already works, because MathLive's own pointer
    // handling moves the selection and re-renders.
    if (!this.promptContaining(this.mathField.position)) {
      this.focusPrompt();
    }
  }

  blur() {
    this.mathField && this.mathField.blur();
  }

  render() {
    const { className, onFocus, onBlur } = this.props;
    const { markup } = this.state;

    if (this.mathField || this.isInteractive()) {
      return <Holder className={className} onFocus={onFocus} onBlur={onBlur} ref={this.holderRef} />;
    }

    return (
      <Holder
        className={className}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={this.holderRef}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    );
  }
}
