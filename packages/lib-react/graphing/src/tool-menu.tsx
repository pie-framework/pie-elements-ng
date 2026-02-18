// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tool-menu.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import ToggleBar from './toggle-bar.js';

export class ToolMenu extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    currentToolType: PropTypes.string,
    disabled: PropTypes.bool,
    draggableTools: PropTypes.bool,
    labelModeEnabled: PropTypes.bool,
    onChange: PropTypes.func,
    onChangeTools: PropTypes.func,
    toolbarTools: PropTypes.arrayOf(PropTypes.string),
    language: PropTypes.string,
  };

  static defaultProps = {
    toolbarTools: [],
  };

  updateToolsOrder: any = (tools) => {
    const { onChangeTools } = this.props;
    onChangeTools(tools);
  };

  render() {
    const { className, currentToolType, disabled, draggableTools, onChange, language } = this.props;
    let { toolbarTools } = this.props;

    return (
      <div className={classNames(className)}>
        <ToggleBar
          disabled={disabled}
          draggableTools={draggableTools}
          options={toolbarTools}
          selectedToolType={currentToolType}
          onChange={onChange}
          onChangeToolsOrder={(tools) => this.updateToolsOrder(tools)}
          language={language}
        />
      </div>
    );
  }
}

export default ToolMenu;
