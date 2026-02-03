// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/layout/settings-box.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

const StyledSettingsBox: any = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `2px solid ${theme.palette.grey[200]}`,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  minWidth: '275px',
  maxWidth: '300px',
  padding: '20px 4px 4px 20px',
  zIndex: 99,
}));

export class SettingsBox extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  };

  static defaultProps = {};

  render() {
    const { className, children } = this.props;

    return <StyledSettingsBox className={className}>{children}</StyledSettingsBox>;
  }
}

export default SettingsBox;
