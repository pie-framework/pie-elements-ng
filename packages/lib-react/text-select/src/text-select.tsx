// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';

import TokenSelect from './token-select/index.js';
import { normalize } from './tokenizer/builder.js';
import { TokenTypes } from './token-select/token.js';
import debug from 'debug';

const log = debug('@pie-lib:text-select');
/**
 * Built on TokenSelect uses build.normalize to build the token set.
 */
export default class TextSelect extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    tokens: PropTypes.arrayOf(PropTypes.shape(TokenTypes)).isRequired,
    selectedTokens: PropTypes.arrayOf(PropTypes.shape(TokenTypes)).isRequired,
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
    highlightChoices: PropTypes.bool,
    animationsDisabled: PropTypes.bool,
    maxNoOfSelections: PropTypes.number,
    language: PropTypes.string,
    // Tokens the learner struck out with an answer eliminator; none can be selected.
    eliminatedTokens: PropTypes.arrayOf(PropTypes.shape({ start: PropTypes.number, end: PropTypes.number })),
  };

  static defaultProps = {
    eliminatedTokens: [],
  };

  change: any = (tokens) => {
    const { onChange } = this.props;

    if (!onChange) {
      return;
    }
    const out = tokens.filter((t) => t.selected).map((t) => ({ start: t.start, end: t.end }));

    onChange(out);
  };

  render() {
    const {
      text,
      disabled,
      tokens,
      selectedTokens,
      className,
      highlightChoices,
      maxNoOfSelections,
      animationsDisabled,
      language,
      eliminatedTokens,
    } = this.props;

    const normalized = normalize(text, tokens);
    log('normalized: ', normalized);
    const prepped = normalized.map((t) => {
      const selectedIndex = selectedTokens.findIndex((s) => {
        return s.start === t.start && s.end === t.end;
      });
      const selected = selectedIndex !== -1;
      const correct = selected ? t.correct : undefined;
      const isMissing = t.isMissing;
      const eliminated = !!t.predefined && (eliminatedTokens || []).some((e) => e.start === t.start && e.end === t.end);
      return {
        ...t,
        selectable: !disabled && t.predefined,
        selected,
        correct,
        isMissing,
        eliminated,
      };
    });

    return (
      <TokenSelect
        highlightChoices={!disabled && highlightChoices}
        className={className}
        tokens={prepped}
        disabled={disabled}
        onChange={this.change}
        maxNoOfSelections={maxNoOfSelections}
        animationsDisabled={animationsDisabled}
        language={language}
      />
    );
  }
}
