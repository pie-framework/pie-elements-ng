// @ts-nocheck
/**
 * @synced-from pie-lib/packages/mask-markup/src/constructed-response.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import classnames from 'classnames';

import { color } from '@pie-lib/render-ui';
import { withMask } from './with-mask';
//import EditableHtml from '@pie-lib/editable-html-tip-tap';

let EditableHtml;
let StyledEditableHtml;

// - mathquill error window not defined
if (typeof window !== 'undefined') {
  EditableHtml = require('@pie-lib/editable-html-tip-tap')['default'];
  StyledEditableHtml = styled(EditableHtml)(() => ({
    display: 'inline-block',
    verticalAlign: 'middle',
    margin: '4px',
    borderRadius: '4px',
    border: `1px solid ${color.black()}`,
    '&.correct': {
      border: `1px solid ${color.correct()}`,
    },
    '&.incorrect': {
      border: `1px solid ${color.incorrect()}`,
    },
  }));
}

const MaskedInput = (props) => (node, data) => {
  const { adjustedLimit, disabled, feedback, showCorrectAnswer, maxLength, spellCheck, pluginProps, onChange } = props;
  const dataset = node.data?.dataset || {};

  if (dataset.component === 'input') {
    const correctAnswer = ((props.choices && dataset && props.choices[dataset.id]) || [])[0];
    const finalValue = showCorrectAnswer ? correctAnswer && correctAnswer.label : data[dataset.id] || '';
    const width = maxLength && maxLength[dataset.id];
    const feedbackStatus = feedback && feedback[dataset.id];
    const isCorrect = showCorrectAnswer || feedbackStatus === 'correct';
    const isIncorrect = !showCorrectAnswer && feedbackStatus === 'incorrect';

    const handleInputChange = (newValue) => {
      const updatedValue = {
        ...data,
        [dataset.id]: newValue,
      };
      onChange(updatedValue);
    };

    const handleKeyDown = (event) => {
      // the keyCode value for the Enter/Return key is 13
      if (event.key === 'Enter' || event.keyCode === 13) {
        return true;
      }
    };

    return (
      <StyledEditableHtml
        id={dataset.id}
        key={`${node.type}-input-${dataset.id}`}
        disabled={showCorrectAnswer || disabled}
        disableUnderline
        onChange={handleInputChange}
        markup={finalValue || ''}
        charactersLimit={adjustedLimit ? width : 25}
        activePlugins={['languageCharacters']}
        pluginProps={pluginProps}
        languageCharactersProps={[{ language: 'spanish' }]}
        spellCheck={spellCheck}
        width={`calc(${width}em + 32px)`} // added 32px for left and right padding of editable-html
        onKeyDown={handleKeyDown}
        autoWidthToolbar
        toolbarOpts={{
          minWidth: 'auto',
          noBorder: true,
          isHidden: !!pluginProps?.characters?.disabled,
        }}
        className={classnames({
          correct: isCorrect,
          incorrect: isIncorrect,
        })}
      />
    );
  }
};

export default withMask('input', MaskedInput);
