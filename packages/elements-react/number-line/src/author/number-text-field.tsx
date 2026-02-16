// @ts-nocheck
/**
 * @synced-from pie-elements/packages/number-line/configure/src/number-text-field.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { NumberTextField as NTF } from '@pie-lib/config-ui';
import { styled } from '@mui/material/styles';

const StyledNumberTextField: any = styled(NTF)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

const MiniField: any = styled(NTF)({
  maxWidth: '100px',
});

const NumberTextField = (props) => {
  return <StyledNumberTextField {...props} variant="outlined" />;
};

export { MiniField };
export default NumberTextField;
