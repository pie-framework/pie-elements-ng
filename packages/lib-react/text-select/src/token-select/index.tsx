// @ts-nocheck

import React from 'react';
import { renderToString } from 'react-dom/server';
import PropTypes from 'prop-types';
import Token, { TokenTypes } from './token.js';
import { styled } from '@mui/material/styles';
import { clone, isEqual } from '@pie-element/shared-lodash';
import debug from 'debug';
import { noSelect } from '@pie-lib/style-utils';
import { createUniqueId } from '@pie-lib/render-ui';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

const log = debug('@pie-lib:text-select:token-select');

const StyledTokenSelect: any = styled('div')(() => ({
  backgroundColor: 'none',
  whiteSpace: 'pre',
  ...noSelect(),
  '& p': {
    whiteSpace: 'break-spaces',
  },
}));

// Invisible container whose only job is to make Emotion inject CSS for all Token variants.
// renderToString produces correct class names but never triggers Emotion's DOM-side injection,
// so without this the class names exist in the HTML but have no matching CSS rules.
const HiddenCssPrimer: any = styled('div')(() => ({
  display: 'none',
  position: 'absolute',
  visibility: 'hidden',
  pointerEvents: 'none',
}));

const normalizeCommonEntities = (text = '') => text.replace(/&nbsp;/gi, ' ');

const normalizeSelectableText = (text = '') =>
  normalizeCommonEntities(text)
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(table|tbody|tr|td|p)[^>]*>/gi, '');

// The evaluate marking each token carries as its description, keyed by the Legend's labels.
const MARKINGS = {
  correct: 'selectText.correctAnswerSelected',
  incorrect: 'selectText.incorrectSelection',
  missing: 'selectText.correctAnswerNotSelected',
};

const markingOf = (t) => {
  if (t.correct !== undefined) {
    return t.correct ? 'correct' : 'incorrect';
  }
  return t.isMissing ? 'missing' : undefined;
};

const isSeparator = (t) => t.text === '\n\n' || t.text === '\n';

// The selector for the tokens in the keyboard sequence: Token gives exactly those a tabindex.
const SEQUENCE_SELECTOR = '[data-indexkey][tabindex]';

const indexOf = (el) => (el ? Number(el.dataset.indexkey) : undefined);

export class TokenSelect extends React.Component {
  static propTypes = {
    tokens: PropTypes.arrayOf(PropTypes.shape(TokenTypes)).isRequired,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    highlightChoices: PropTypes.bool,
    animationsDisabled: PropTypes.bool,
    maxNoOfSelections: PropTypes.number,
    language: PropTypes.string,
  };

  static defaultProps = {
    highlightChoices: false,
    maxNoOfSelections: 0,
    tokens: [],
  };

  containerRef = React.createRef();

  idPrefix = createUniqueId('text-select');

  // The token that last had focus keeps the tab stop. Kept off state: moving it must not
  // re-render the text, which would replace the DOM and drop typeset math.
  activeIndex = undefined;

  // Whether the last toggle came from a key, so restoring focus after it shows the ring.
  keyboardToggle = false;

  operable = () => !this.props.disabled && !this.props.animationsDisabled;

  selectedCount = () => this.props.tokens.filter((t) => t.selected).length;

  canSelectMore: any = (selectedCount) => {
    const { maxNoOfSelections } = this.props;

    if (maxNoOfSelections === 1) return true;

    log('[canSelectMore] maxNoOfSelections: ', maxNoOfSelections, 'selectedCount: ', selectedCount);
    return maxNoOfSelections <= 0 || (isFinite(maxNoOfSelections) && selectedCount < maxNoOfSelections);
  };

  toggleToken: any = (event) => {
    const targetSpanWrapper = event.target.closest?.(`.${Token.rootClassName}`);
    const targetedTokenIndex = targetSpanWrapper?.dataset?.indexkey;

    if (targetedTokenIndex !== undefined) {
      this.keyboardToggle = false;
      this.toggleAt(Number(targetedTokenIndex));
    }
  };

  toggleAt: any = (targetedTokenIndex) => {
    const { tokens, animationsDisabled } = this.props;
    const tokensCloned = clone(tokens);
    const t = tokensCloned[targetedTokenIndex];

    // A screen reader can click a token that is only exposed, as in view mode.
    if (!this.operable()) {
      return;
    }

    // don't toggle if in print mode, correctness is defined, or is missing
    if (t && t.correct === undefined && !animationsDisabled && !t.isMissing) {
      const { onChange, maxNoOfSelections } = this.props;
      const selected = !t.selected;

      if (maxNoOfSelections === 1 && this.selectedCount() === 1) {
        const selectedToken = (tokens || []).filter((tk) => tk.selected);
        const updatedTokens = tokensCloned.map((token) => {
          if (isEqual(token, selectedToken[0])) {
            return { ...token, selected: false };
          }
          return { ...token, selectable: true };
        });

        const update = { ...t, selected };
        updatedTokens.splice(targetedTokenIndex, 1, update);
        onChange(updatedTokens);
      } else {
        if (selected && maxNoOfSelections > 0 && this.selectedCount() >= maxNoOfSelections) {
          log('skip toggle max reached');
          return;
        }
        const update = { ...t, selected };
        tokensCloned.splice(targetedTokenIndex, 1, update);
        onChange(tokensCloned);
      }
    }
  };

  sequence = () => Array.from(this.containerRef.current?.querySelectorAll(SEQUENCE_SELECTOR) || []);

  focusedToken = () => {
    const container = this.containerRef.current;
    const active = container?.getRootNode().activeElement;

    return active && container.contains(active) ? active.closest(SEQUENCE_SELECTOR) : null;
  };

  // Roving tabindex: one token holds tabindex 0. Tab enters on the token last focused, else the
  // first selected token, else the first token.
  syncTabStop = () => {
    const tokens = this.sequence();
    const stop =
      tokens.find((el) => indexOf(el) === this.activeIndex) ||
      tokens.find((el) => el.getAttribute('aria-pressed') === 'true') ||
      tokens[0];

    tokens.forEach((el) => {
      const tabIndex = el === stop ? '0' : '-1';

      if (el.getAttribute('tabindex') !== tabIndex) {
        el.setAttribute('tabindex', tabIndex);
      }
    });

    return stop;
  };

  onFocus: any = (event) => {
    const token = event.target.closest?.(SEQUENCE_SELECTOR);

    if (token) {
      this.activeIndex = indexOf(token);
      this.syncTabStop();
    }
  };

  onKeyDown: any = (event) => {
    if (!this.operable() || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const token = event.target.closest?.(SEQUENCE_SELECTOR);

    if (!token) {
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();

      if (!event.repeat && token.getAttribute('aria-disabled') !== 'true') {
        this.keyboardToggle = true;
        this.toggleAt(indexOf(token));
      }
      return;
    }

    const tokens = this.sequence();
    const position = tokens.indexOf(token);
    const last = tokens.length - 1;
    const target = {
      ArrowRight: Math.min(position + 1, last),
      ArrowDown: Math.min(position + 1, last),
      ArrowLeft: Math.max(position - 1, 0),
      ArrowUp: Math.max(position - 1, 0),
      Home: 0,
      End: last,
    }[event.key];

    if (target !== undefined) {
      event.preventDefault();
      tokens[target].focus();
    }
  };

  componentDidMount() {
    this.syncTabStop();
  }

  // The text renders from an HTML string, so a toggle replaces the focused token's element.
  getSnapshotBeforeUpdate() {
    const token = this.focusedToken();

    return token ? indexOf(token) : null;
  }

  componentDidUpdate(prevProps, prevState, focusedIndex) {
    const stop = this.syncTabStop();

    if (focusedIndex === null || focusedIndex === undefined || this.focusedToken()) {
      return;
    }

    const token = this.sequence().find((el) => indexOf(el) === focusedIndex) || stop;

    token?.focus({ preventScroll: true, focusVisible: this.keyboardToggle });
  }

  groupName = () => {
    const { maxNoOfSelections, language } = this.props;

    return maxNoOfSelections > 0
      ? translator.t('selectText.textGroupWithLimit', { lng: language, max: maxNoOfSelections })
      : translator.t('selectText.textGroup', { lng: language });
  };

  /**
   * Build an HTML string so that non-selectable token text (which may contain arbitrary or even
   * *partial* HTML — e.g. just an opening <table><tbody><tr><td> in one token and the matching
   * closing tags in another) is preserved exactly as-is.  Selectable Token components are
   * serialised via renderToString; their Emotion class names are stable hashes so they match the
   * CSS that the HiddenCssPrimer forces Emotion to inject into the document.
   *
   * Returns the descriptions the tokens reference alongside the HTML.
   */
  generateTokensInHtml: any = () => {
    const { tokens, disabled, highlightChoices, animationsDisabled, language } = this.props;
    const selectedCount = this.selectedCount();
    const operable = this.operable();
    const descriptions = {};

    // In gather every authored token stays in the keyboard sequence, unavailable ones included.
    const inSequence = (t) => operable && !isSeparator(t) && (t.selected || t.selectable);
    const total = (tokens || []).filter(inSequence).length;
    let position = 0;

    const describe = (key, text) => {
      const id = `${this.idPrefix}-${key}`;
      descriptions[id] = text;
      return id;
    };

    const reducer = (accumulator, t, index) => {
      const selectable = t.selected || (t.selectable && this.canSelectMore(selectedCount));
      const showCorrectAnswer = t.correct !== undefined && (t.selectable || t.selected);

      if (t.text === '\n\n') return `${accumulator}</p><p>`;

      if (t.text === '\n') return `${accumulator}<br>`;

      if (
        inSequence(t) ||
        (selectable && !disabled) ||
        showCorrectAnswer ||
        t.selected ||
        t.isMissing ||
        (animationsDisabled && t.predefined)
      ) {
        const sequenced = inSequence(t);
        let describedBy;

        if (sequenced) {
          position += 1;
          describedBy = describe(
            `position-${position}`,
            translator.t('selectText.tokenPosition', { lng: language, index: position, total }),
          );
        } else {
          const marking = markingOf(t);

          if (marking) {
            describedBy = describe(marking, translator.t(MARKINGS[marking], { lng: language }));
          }
        }

        return (
          accumulator +
          renderToString(
            <Token
              key={index}
              disabled={disabled}
              index={index}
              {...t}
              text={normalizeSelectableText(t.text)}
              selectable={selectable}
              highlight={highlightChoices}
              animationsDisabled={animationsDisabled}
              operable={sequenced}
              describedBy={describedBy}
            />,
          )
        );
      }

      // Non-selectable: emit raw HTML unchanged (may contain partial tags, tables, lists, etc.)
      return accumulator + normalizeCommonEntities(t.text);
    };

    const html = (tokens || []).reduce(reducer, '<p>') + '</p>';

    return { html, descriptions };
  };

  render() {
    const { className: classNameProp } = this.props;
    const { html, descriptions } = this.generateTokensInHtml();

    // Render one invisible Token per visual variant so Emotion injects all CSS rules into the
    // document before the browser paints the dangerouslySetInnerHTML content.
    const primerText = ' ';
    return (
      <>
        <HiddenCssPrimer aria-hidden="true">
          {/* base / selectable */}
          <Token
            text={primerText}
            index={-1}
            selectable
            disabled={false}
            highlight={false}
            animationsDisabled={false}
          />
          {/* highlight */}
          <Token text={primerText} index={-1} selectable disabled={false} highlight animationsDisabled={false} />
          {/* selected */}
          <Token
            text={primerText}
            index={-1}
            selectable
            selected
            disabled={false}
            highlight={false}
            animationsDisabled={false}
          />
          {/* disabled + selected */}
          <Token
            text={primerText}
            index={-1}
            selectable
            selected
            disabled
            highlight={false}
            animationsDisabled={false}
          />
          {/* print / animationsDisabled */}
          <Token
            text={primerText}
            index={-1}
            selectable
            disabled={false}
            highlight={false}
            animationsDisabled
            predefined
          />
          {/* correct */}
          <Token
            text={primerText}
            index={-1}
            selectable
            selected
            correct
            disabled={false}
            highlight={false}
            animationsDisabled={false}
          />
          {/* incorrect */}
          <Token
            text={primerText}
            index={-1}
            selectable
            selected
            correct={false}
            disabled={false}
            highlight={false}
            animationsDisabled={false}
          />
          {/* missing */}
          <Token text={primerText} index={-1} isMissing disabled={false} highlight={false} animationsDisabled={false} />
        </HiddenCssPrimer>

        <StyledTokenSelect
          ref={this.containerRef}
          className={classNameProp}
          role="group"
          aria-label={this.groupName()}
          onClick={this.toggleToken}
          onKeyDown={this.onKeyDown}
          onFocus={this.onFocus}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {Object.keys(descriptions).length > 0 && (
          <div hidden>
            {Object.entries(descriptions).map(([id, text]) => (
              <span key={id} id={id}>
                {text}
              </span>
            ))}
          </div>
        )}
      </>
    );
  }
}

export default TokenSelect;
export { TokenTypes };
