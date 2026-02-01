// @ts-nocheck
/**
 * @synced-from pie-elements/packages/fraction-model/configure/src/number-text-field.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { NumberTextField as NTF } from '@pie-lib/config-ui';
import React from 'react';
import { styled } from '@mui/material/styles';

const StyledNTF: any = styled(NTF)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

const MiniStyledNTF: any = styled(NTF)({
  maxWidth: '120px',
  width: '120px',
  marginTop: '0',
  '& [class^="MuiInputBase-root"]': {
    height: 40,
    fontSize: '14px',
  },
});

export class NumberTextField extends React.Component {
  static propTypes = {};

  render() {
    const props = { ...this.props };
    return <StyledNTF {...props} variant="outlined" />;
  }
}

export const MiniField = React.forwardRef((props, ref) => (
  <MiniStyledNTF {...props} ref={ref} variant="outlined" />
));

export default NumberTextField;
