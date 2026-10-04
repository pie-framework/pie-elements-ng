// @ts-nocheck

import React from 'react';
import { styled } from '@mui/material/styles';
import classnames from 'clsx';

import { color } from '@pie-lib/render-ui';
import Translator from '@pie-lib/translator';
import { withMask } from './with-mask.js';
import EditableHtmlImport from '@pie-lib/editable-html-tip-tap';

const { translator } = Translator;

// Response ids in reading order, from the {{n}} placeholders componentize turns into inputs.
const responseIds = (markup) => [...new Set(Array.from((markup || '').matchAll(/\{\{(\d+)\}\}/g), (m) => m[1]))];

const EditableHtml = EditableHtmlImport;
const StyledEditableHtml: any = styled(EditableHtml)(() => ({
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

const MaskedInput = (props) => (node, data) => {
  const { adjustedLimit, disabled, feedback, showCorrectAnswer, maxLength, spellCheck, pluginProps, onChange } = props;
  const dataset = node.data?.dataset || {};

  if (dataset.component === 'input') {
    const ids = responseIds(props.markup);
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
        adjustWidthForLimit
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
        ariaLabel={translator.t('explicitConstructedResponse.response', {
          lng: props.language,
          index: ids.indexOf(dataset.id) + 1,
          total: ids.length,
        })}
      />
    );
  }
};

export default withMask('input', MaskedInput);
