// @ts-nocheck
/**
 * @synced-from pie-lib/packages/mask-markup/src/components/correct-input.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import classnames from 'classnames';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';

const StyledOutlinedInput: any = styled(OutlinedInput)(() => ({
  padding: '2px',
  borderRadius: '4px',
  fontSize: 'inherit',
  display: 'inline-block',
  verticalAlign: 'middle',
  '& fieldset': {
    border: 0,
  },
  '& .MuiOutlinedInput-input': {
    color: color.text(),
    backgroundColor: color.background(),
    borderRadius: '4px !important',
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '10px 20px 10px 10px',
    '&:disabled': {
      opacity: 0.8,
      cursor: 'not-allowed !important',
    },
    '&:hover': {
      borderColor: color.primary(),
      '&:disabled': {
        borderColor: 'initial',
      },
    },
    '&.Mui-focused': {
      borderColor: color.primaryDark(),
    },
    '&.crInput': {
      padding: '8px !important',
    },
    '&.correct': {
      borderColor: `${color.correct()} !important`,
    },
    '&.incorrect': {
      borderColor: `${color.incorrect()} !important`,
    },
  },
}));

const CorrectInput = (props) => {
  const {
    correct,
    charactersLimit,
    disabled,
    isBox,
    isConstructedResponse,
    width,
    spellCheck,
    ...rest
  } = props;

  const label = typeof correct === 'boolean' ? (correct ? 'correct' : 'incorrect') : undefined;
  const inputProps = charactersLimit
    ? { maxLength: charactersLimit, 'aria-label': 'Enter answer' }
    : { 'aria-label': 'Enter answer' };

  if (width) {
    inputProps.style = {
      width: `${width + Math.round(width / 10) + 1}ch`, // added some extra space for capital letters
    };
  }

  return (
    <StyledOutlinedInput
      className={classnames({
        disabledInput: disabled,
        box: isBox,
      })}
      classes={{
        input: classnames({
          [label]: label,
          crInput: isConstructedResponse,
        }),
      }}
      inputProps={inputProps}
      disabled={disabled}
      spellCheck={spellCheck}
      {...rest}
    />
  );
};

export default CorrectInput;

