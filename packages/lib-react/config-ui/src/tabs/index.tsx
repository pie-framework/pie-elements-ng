// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/tabs/index.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';

import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

const StyledMuiTab: any = styled(MuiTab)(() => ({}));

export class Tabs extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    contentClassName: PropTypes.string,
    contentStyle: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { value: 0 };
  }

  handleChange: any = (event, value) => {
    this.setState({ value });
  };

  render() {
    const { value } = this.state;
    const { children, className, contentClassName, contentStyle = {} } = this.props;

    return (
      <div className={className}>
        <MuiTabs indicatorColor="primary" value={value} onChange={this.handleChange}>
          {React.Children.map(children, (c, index) =>
            c && c.props.title ? <StyledMuiTab key={index} label={c.props.title} /> : null,
          )}
        </MuiTabs>

        <div className={contentClassName} style={contentStyle}>
          {children[value]}
        </div>
      </div>
    );
  }
}

export default Tabs;
