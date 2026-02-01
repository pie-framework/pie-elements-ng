// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/settings/display-size.jsx
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
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import NumberTextField from '../number-text-field';

const StyledDisplaySize: any = styled('div')(({ theme }) => ({
  display: 'flex',
  paddingTop: theme.spacing(1),
}));

const DisplaySize = ({ size, label, onChange }) => {
  const updateSize = (key, v) => {
    onChange({ ...size, [key]: v });
  };
  
  return (
    <div>
      <Typography>{label}</Typography>
      <StyledDisplaySize>
        <NumberTextField
          label="Width"
          type="number"
          variant="outlined"
          value={size.width}
          min={150}
          max={1000}
          onChange={(e, v) => updateSize('width', v)}
        />
        <NumberTextField
          label="Height"
          type="number"
          variant="outlined"
          min={150}
          max={1000}
          value={size.height}
          onChange={(e, v) => updateSize('height', v)}
        />
      </StyledDisplaySize>
    </div>
  );
};

DisplaySize.propTypes = {
  size: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func,
};

export default DisplaySize;
