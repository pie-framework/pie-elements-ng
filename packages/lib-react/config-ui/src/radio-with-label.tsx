// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/radio-with-label.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';

const StyledFormControlLabel: any = styled(FormControlLabel)(() => ({
  '& .MuiFormControlLabel-label': {
    left: '-5px',
    position: 'relative',
  },
}));

const StyledRadio: any = styled(Radio)(() => ({
  color: `${color.tertiary()} !important`,
}));

const RadioWithLabel = ({ label, value, checked, onChange }) => (
  <StyledFormControlLabel
    value={value}
    control={<StyledRadio checked={checked} onChange={onChange} />}
    label={label}
  />
);

RadioWithLabel.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
};

export default RadioWithLabel;
