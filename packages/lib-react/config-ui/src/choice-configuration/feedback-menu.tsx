// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/choice-configuration/feedback-menu.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { InlineMenu as MenuImport } from '@pie-lib/render-ui';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
const Menu = unwrapReactInteropSymbol(MenuImport, 'InlineMenu');
import MenuItem from '@mui/material/MenuItem';
import ActionFeedback from '@mui/icons-material/Feedback';
import IconButton from '@mui/material/IconButton';
import PropTypes from 'prop-types';
import React from 'react';

export class IconMenu extends React.Component {
  static propTypes = {
    opts: PropTypes.object,
    onClick: PropTypes.func.isRequired,
    iconButtonElement: PropTypes.any,
  };

  constructor(props) {
    super(props);
    this.state = {
      anchorEl: undefined,
      open: false,
    };
  }

  handleClick: any = (event) => {
    this.setState({ open: true, anchorEl: event.currentTarget });
  };

  handleRequestClose: any = () => {
    this.setState({ open: false });
  };

  render() {
    const { opts, onClick } = this.props;
    const keys = Object.keys(opts);

    const handleMenuClick = (key) => () => {
      onClick(key);
      this.handleRequestClose();
    };

    return (
      <div>
        <div onClick={this.handleClick}>{this.props.iconButtonElement}</div>
        <Menu
          id="simple-menu"
          anchorEl={this.state.anchorEl}
          open={this.state.open}
          onClose={this.handleRequestClose}
          transitionDuration={{ enter: 225, exit: 195 }}
        >
          {keys.map((k, index) => (
            <MenuItem key={index} onClick={handleMenuClick(k)}>
              {opts[k]}
            </MenuItem>
          ))}
        </Menu>
      </div>
    );
  }
}

export default class FeedbackMenu extends React.Component {
  static propTypes = {
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {
    classes: {},
  };

  render() {
    const { value, onChange, classes } = this.props;
    const t = value && value.type;
    const iconColor = t === 'custom' || t === 'default' ? 'primary' : 'disabled';
    const tooltip = t === 'custom' ? 'Custom Feedback' : t === 'default' ? 'Default Feedback' : 'Feedback disabled';

    const icon = (
      <IconButton className={classes.icon} aria-label={tooltip} size="large">
        <ActionFeedback color={iconColor} />
      </IconButton>
    );

    return (
      <IconMenu
        iconButtonElement={icon}
        onClick={(key) => onChange(key)}
        opts={{
          none: 'No Feedback',
          default: 'Default',
          custom: 'Custom',
        }}
      />
    );
  }
}
