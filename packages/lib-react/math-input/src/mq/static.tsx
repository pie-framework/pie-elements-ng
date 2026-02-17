// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/mq/static.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import PropTypes from 'prop-types';
import React from 'react';
import debug from 'debug';
import { updateSpans } from '../updateSpans';
import { countBraces, createStatic, stripSpaces } from '@pie-element/shared-math-engine';

const log = debug('pie-lib:math-input:mq:static');
const REGEX = /\\MathQuillMathField\[r\d*\]\{(.*?)\}/g;

/**
 * Wrapper for MathQuill MQ.MathField.
 */
export default class Static extends React.Component {
  static propTypes = {
    latex: PropTypes.string.isRequired,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    getFieldName: PropTypes.func,
    onSubFieldChange: PropTypes.func,
    onSubFieldFocus: PropTypes.func,
    setInput: PropTypes.func,
  };

  static defaultProps = {
    getFieldName: () => {},
  };

  constructor(props) {
    super(props);
    this.state = {
      announcement: '',
      previousLatex: '',
      inputSource: null,
      isDeleteKeyPressed: false,
    };

    this.inputRef = React.createRef();
  }

  componentDidMount() {
    this.update();
    updateSpans(this.inputRef?.current || undefined);

    this.createLiveRegion();
    this.addEventListeners();
  }

  componentDidUpdate() {
    this.update();
    updateSpans(this.inputRef?.current || undefined);
  }

  componentWillUnmount() {
    this.mathField?.destroy?.();
    this.mathField = null;
    this.removeLiveRegion();
    this.removeEventListeners();
  }

  createLiveRegion: any = () => {
    this.liveRegion = document.createElement('div');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.marginTop = '-1px';
    this.liveRegion.style.clip = 'rect(1px, 1px, 1px, 1px)';
    this.liveRegion.style.overflow = 'hidden';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');

    document.body.appendChild(this.liveRegion);
  };

  addEventListeners: any = () => {
    const input = this.inputRef.current;

    if (input) {
      input.addEventListener('keydown', this.handleKeyDown);
      input.addEventListener('click', this.handleMathKeyboardClick);
    }
  };

  removeEventListeners: any = () => {
    const input = this.inputRef.current;

    if (input) {
      input.removeEventListener('keydown', this.handleKeyDown);
      input.removeEventListener('click', this.handleMathKeyboardClick);
    }
  };

  removeLiveRegion: any = () => {
    if (this.liveRegion) {
      document.body.removeChild(this.liveRegion);
      this.liveRegion = null;
    }
  };

  handleKeyDown: any = (event) => {
    if (event?.key === 'Backspace' || event?.key === 'Delete') {
      this.setState({ isDeleteKeyPressed: true });
    }
    this.setState({ inputSource: 'keyboard' });
  };

  handleMathKeyboardClick: any = () => {
    this.setState({ inputSource: 'mathKeyboard' });
  };

  onInputEdit: any = (field) => {
    if (!this.mathField || !field) {
      return;
    }
    const name = this.props.getFieldName(field, this.mathField.innerFields || []);

    if (this.props.onSubFieldChange) {
      this.props.onSubFieldChange(name, field.latex());
    }

    this.announceLatexConversion(field.latex());
  };

  announceLatexConversion: any = (newLatex) => {
    if (!this.state) {
      // eslint-disable-next-line no-console
      console.error('State is not initialized');
      return;
    }

    const { previousLatex, inputSource, isDeleteKeyPressed } = this.state;
    const announcement = 'Converted to math symbol';

    if (inputSource === 'keyboard' && !isDeleteKeyPressed) {
      const newBraces = countBraces(newLatex);
      const oldBraces = countBraces(previousLatex);

      if (newBraces > oldBraces) {
        this.announceMessage(announcement);
      } else {
        try {
          if (newLatex == previousLatex) {
            this.announceMessage(announcement);
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Error parsing latex:', e.message);
          // eslint-disable-next-line no-console
          console.warn(e);
        }
      }
    }

    this.setState({ previousLatex: newLatex, isDeleteKeyPressed: false });
  };

  announceMessage: any = (message) => {
    this.setState({ previousLatex: '' });

    if (this.liveRegion) {
      this.liveRegion.textContent = message;

      // Clear the message after it is announced
      setTimeout(() => {
        this.liveRegion.textContent = '';
      }, 500);
    }
  };

  update: any = () => {
    const buildInnerFields = () => {
      const fields = this.mathField.getFields();
      fields.forEach((field) => {
        fields[`r${field.id}`] = field;
      });
      return fields;
    };

    if (!this.mathField) {
      this.mathField = createStatic(this.props.latex || '', {
        onFieldChange: (fieldId) => {
          const field = this.mathField.getFieldById(fieldId);
          this.onInputEdit(field);
        },
        onFieldFocus: (fieldId) => {
          this.onFocus({ target: this.mathField.getFieldById(fieldId)?.el() });
        },
      });
      this.mathField.mount(this.inputRef?.current);
      this.mathField.innerFields = buildInnerFields();
    }

    const nextLatex = this.props.latex ?? '';
    const currentLatex = this.mathField.getLatex();

    if (stripSpaces(nextLatex) === stripSpaces(currentLatex)) {
      return;
    }

    this.mathField.setLatex(nextLatex);
    this.mathField.innerFields = buildInnerFields();
  };

  blur: any = () => {
    log('blur mathfield');
    this.mathField?.getFields?.().forEach((field) => field.blur());
  };

  focus: any = () => {
    log('focus mathfield...');
    this.mathField?.getFields?.()?.[0]?.focus?.();
  };

  shouldComponentUpdate(nextProps) {
    if (!this.mathField) {
      return true;
    }

    try {
      const parsedLatex = nextProps.latex;
      const stripped = stripSpaces(parsedLatex);
      const newFieldCount = (nextProps.latex.match(REGEX) || []).length;

      const out =
        stripped !== stripSpaces(this.mathField.getLatex().trim()) ||
        newFieldCount !== Object.keys(this.mathField.innerFields || {}).length;

      log('[shouldComponentUpdate] ', out);
      return out;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Error parsing latex:', e.message, 'skip update');
      // eslint-disable-next-line no-console
      console.warn(e);
      return false;
    }
  }

  onFocus: any = (e) => {
    try {
      const resolveBlockId = (target: HTMLElement | null): number | null => {
        if (!target) return null;

        const direct = target.closest('[mathquill-block-id]') as HTMLElement | null;
        const fromDirect = direct?.getAttribute('mathquill-block-id');
        if (fromDirect) {
          const parsed = parseInt(fromDirect, 10);
          if (!Number.isNaN(parsed)) return parsed;
        }

        const sibling = (target.parentElement?.nextElementSibling ||
          target.nextElementSibling) as HTMLElement | null;
        const fromSibling = sibling?.getAttribute('mathquill-block-id');
        if (fromSibling) {
          const parsed = parseInt(fromSibling, 10);
          if (!Number.isNaN(parsed)) return parsed;
        }

        return null;
      };

      const id = resolveBlockId(e?.target as HTMLElement);
      const innerField = (this.mathField.innerFields || []).find((f) => f.id === id);

      if (innerField) {
        const name = this.props.getFieldName(innerField, this.mathField.innerFields);
        if (this.props.setInput) {
          this.props.setInput(innerField);
        }
        this.props.onSubFieldFocus(name, innerField);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('error finding root block', err.message);
    }
  };

  render() {
    const { onBlur, className } = this.props;

    return <span className={className} onFocus={this.onFocus} onBlur={onBlur} ref={this.inputRef} />;
  }
}
