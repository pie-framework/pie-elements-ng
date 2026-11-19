// @ts-nocheck

import React, { useId } from 'react';
import PropTypes from 'prop-types';
import InputLabel from '@mui/material/InputLabel';
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import { color } from '@pie-lib/render-ui';

const StyledToggle: any = styled('div')(() => ({
  display: 'flex',
  width: '100%',
  justifyContent: 'space-between',
}));

const StyledInputLabel: any = styled(InputLabel)(({ theme }) => ({
  color: 'rgba(0, 0, 0, 0.89)',
  fontSize: theme.typography.fontSize,
  paddingTop: theme.spacing(2),
}));

const StyledSwitch: any = styled(Switch)(({ checked }) => ({
  '&.Mui-checked .MuiSwitch-thumb': {
    color: `${color.tertiary()} !important`,
  },
  '&.Mui-checked .MuiSwitch-track': {
    backgroundColor: `${color.tertiaryLight()} !important`,
  },
  '& .MuiSwitch-track': {
    backgroundColor: checked ? `${color.tertiaryLight()} !important` : undefined,
  },
}));

const StyledHelperText: any = styled('p')(({ theme }) => ({
  margin: 0,
  color: 'rgba(0, 0, 0, 0.89)',
  fontSize: theme.typography.fontSize - 2,
}));

const Toggle = ({ checked, disabled, label, toggle, helperText }) => {
  // The label names the switch, which is otherwise announced with no name.
  const id = useId();
  const helpId = `${id}-help`;

  const row = (
    <StyledToggle>
      <StyledInputLabel htmlFor={id}>{label}</StyledInputLabel>
      <StyledSwitch
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => toggle(e.target.checked)}
        {...(helperText ? { slotProps: { input: { 'aria-describedby': helpId } } } : {})}
      />
    </StyledToggle>
  );

  if (!helperText) {
    return row;
  }

  // The help text describes the switch, and sits under it.
  return (
    <div>
      {row}
      <StyledHelperText id={helpId}>{helperText}</StyledHelperText>
    </div>
  );
};

Toggle.propTypes = {
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  toggle: PropTypes.func.isRequired,
  helperText: PropTypes.node,
};

export default Toggle;
