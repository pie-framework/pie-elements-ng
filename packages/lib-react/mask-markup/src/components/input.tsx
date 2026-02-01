// @ts-nocheck
/**
 * @synced-from pie-lib/packages/mask-markup/src/components/input.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CorrectInput from './correct-input';

const Input = ({
  disabled,
  correct,
  charactersLimit,
  id,
  isConstructedResponse,
  value,
  onChange,
  showCorrectAnswer,
  spellCheck,
  width,
}) => {
  return (
    <CorrectInput
      disabled={disabled}
      correct={showCorrectAnswer || correct}
      charactersLimit={charactersLimit}
      variant="outlined"
      value={value}
      isConstructedResponse={isConstructedResponse}
      spellCheck={spellCheck}
      isBox={true}
      width={width}
      onChange={(e) => {
        onChange(id, e.target.value);
      }}
    />
  );
};

Input.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  spellCheck: PropTypes.bool,
  correct: PropTypes.bool,
  showCorrectAnswer: PropTypes.bool,
  charactersLimit: PropTypes.number,
  width: PropTypes.number,
  isConstructedResponse: PropTypes.bool,
};

export default Input;
