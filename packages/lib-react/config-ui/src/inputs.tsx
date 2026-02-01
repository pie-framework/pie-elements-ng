// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/inputs.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import { InputContainer } from '@pie-lib/render-ui';
import PropTypes from 'prop-types';
import React from 'react';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';

const InputTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.string,
};

const StyledSwitch: any = styled(Switch)(() => ({
  justifyContent: 'inherit',
  transform: 'translate(-20%, 20%)',
}));

const InputSwitch = ({ className, label, checked, onChange }) => {
  return (
    <InputContainer className={className} label={label}>
      <StyledSwitch checked={checked} onChange={onChange} aria-label={label} />
    </InputContainer>
  );
};

InputSwitch.propTypes = { ...InputTypes };

const StyledCheckbox: any = styled(Checkbox)(({ theme, error }) => ({
  transform: 'translate(-25%, 20%)',
  color: `${color.tertiary()} !important`,
  ...(error && {
    color: `${theme.palette.error.main} !important`,
  }),
}));

const InputCheckbox = ({ className, label, checked, onChange, disabled, error }) => {
  return (
    <InputContainer className={className} label={label}>
      <StyledCheckbox
        disabled={disabled}
        checked={checked}
        onChange={onChange}
        aria-label={label}
        error={error}
      />
    </InputContainer>
  );
};

InputCheckbox.propTypes = { ...InputTypes };

const StyledRadio: any = styled(Radio)(({ theme, error }) => ({
  transform: 'translate(-20%, 20%)',
  color: `${color.tertiary()} !important`,
  ...(error && {
    color: `${theme.palette.error.main} !important`,
  }),
}));

const InputRadio = ({ className, label, checked, onChange, disabled, error }) => {
  return (
    <InputContainer className={className} label={label}>
      <StyledRadio
        disabled={disabled}
        checked={checked}
        onChange={onChange}
        aria-label={label}
        error={error}
      />
    </InputContainer>
  );
};

InputRadio.propTypes = { ...InputTypes };

export { InputSwitch, InputCheckbox, InputRadio };
