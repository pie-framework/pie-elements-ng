// @ts-nocheck
/**
 * @synced-from pie-lib/packages/render-ui/src/preview-layout.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import UiLayout from './ui-layout';

const StyledUiLayout: any = styled(UiLayout)({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
});

class PreviewLayout extends React.Component {
  static propTypes = {
    ariaLabel: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
    role: PropTypes.string,
    extraCSSRules: PropTypes.shape({
      names: PropTypes.arrayOf(PropTypes.string),
      rules: PropTypes.string,
    }),
    fontSizeFactor: PropTypes.number,
  };

  render() {
    const { children, ariaLabel, role, extraCSSRules, fontSizeFactor, classes } = this.props;
    const accessibility = ariaLabel ? { 'aria-label': ariaLabel, role } : {};

    return (
      <StyledUiLayout {...accessibility} extraCSSRules={extraCSSRules} fontSizeFactor={fontSizeFactor} classes={classes}>
        {children}
      </StyledUiLayout>
    );
  }
}

export default PreviewLayout;
