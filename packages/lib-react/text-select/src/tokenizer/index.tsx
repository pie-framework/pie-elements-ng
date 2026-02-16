// @ts-nocheck
/**
 * @synced-from pie-lib/packages/text-select/src/tokenizer/index.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Controls from './controls';
import { styled } from '@mui/material/styles';
import { paragraphs, sentences, words } from './builder';
import { clone, differenceWith, isEqual } from 'lodash-es';
import { noSelect } from '@pie-lib/style-utils';
import TokenText from './token-text';

const StyledText: any = styled('div')(({ disabled }) => ({
  whiteSpace: 'pre-wrap',

  ...(disabled && {
    ...noSelect(),
  }),
}));

export class Tokenizer extends React.Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    tokens: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string,
        correct: PropTypes.bool,
        start: PropTypes.number,
        end: PropTypes.number,
      }),
    ),
    onChange: PropTypes.func.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.state = {
      setCorrectMode: false,
      mode: '',
    };
  }

  onChangeHandler: any = (token, mode) => {
    this.props.onChange(token, mode);

    this.setState({
      mode,
    });
  };

  toggleCorrectMode = () => this.setState({ setCorrectMode: !this.state.setCorrectMode });

  clear: any = () => {
    this.onChangeHandler([], '');
  };

  buildTokens: any = (type, fn) => {
    const { text } = this.props;
    const tokens = fn(text);

    this.onChangeHandler(tokens, type);
  };

  selectToken: any = (newToken, tokensToRemove) => {
    const { tokens } = this.props;
    const update = differenceWith(clone(tokens), tokensToRemove, isEqual);

    update.push(newToken);
    this.onChangeHandler(update, this.state.mode);
  };

  tokenClick: any = (token) => {
    const { setCorrectMode } = this.state;

    if (setCorrectMode) {
      this.setCorrect(token);
    } else {
      this.removeToken(token);
    }
  };

  tokenIndex: any = (token) => {
    const { tokens } = this.props;

    return tokens.findIndex((t) => {
      return t.text == token.text && t.start == token.start && t.end == token.end;
    });
  };

  setCorrect: any = (token) => {
    const { tokens } = this.props;
    const index = this.tokenIndex(token);
    if (index !== -1) {
      const t = tokens[index];

      t.correct = !t.correct;

      const update = clone(tokens);

      update.splice(index, 1, t);
      this.onChangeHandler(update, this.state.mode);
    }
  };

  removeToken: any = (token) => {
    const { tokens } = this.props;

    const index = this.tokenIndex(token);
    if (index !== -1) {
      const update = clone(tokens);

      update.splice(index, 1);

      this.onChangeHandler(update, this.state.mode);
    }
  };

  render() {
    const { text, tokens } = this.props;
    const { setCorrectMode } = this.state;

    return (
      <div>
        <Controls
          onClear={this.clear}
          onWords={() => this.buildTokens('words', words)}
          onSentences={() => this.buildTokens('sentence', sentences)}
          onParagraphs={() => this.buildTokens('paragraphs', paragraphs)}
          setCorrectMode={setCorrectMode}
          onToggleCorrectMode={this.toggleCorrectMode}
        />
        <StyledText
          disabled={setCorrectMode}
          as={TokenText}
          text={text}
          tokens={tokens}
          onTokenClick={this.tokenClick}
          onSelectToken={this.selectToken}
        />
      </div>
    );
  }
}

export default Tokenizer;
