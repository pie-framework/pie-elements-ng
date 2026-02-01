// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/input.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import * as React from 'react';
import PropTypes from 'prop-types';
import { default as MaterialInput } from '@mui/material/Input';
import { InputContainer } from '@pie-lib/render-ui';

export default class Input extends React.Component {
  static propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    label: PropTypes.string,
    type: PropTypes.string.isRequired,
    error: PropTypes.func,
    noModelUpdateOnError: PropTypes.bool,
  };

  static defaultProps = {
    type: 'text',
    error: (value, type) => (type === 'number' ? !value || isNaN(value) : !value),
    noModelUpdateOnError: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      value: props.value,
    };
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    this.setState({
      value: newProps.value,
    });
  }

  onChange: any = (event) => {
    const { type, onChange, error } = this.props;
    const value = event.target.value;

    if (error(value, type)) {
      this.setState({
        error: true,
        value: event.target.value,
      });
    } else {
      this.setState({
        error: false,
        value: event.target.value,
      });

      onChange(event);
    }
  };

  render() {
    const {
      label,
      type,
      noModelUpdateOnError, // eslint-disable-line no-unused-vars
      ...rest
    } = this.props;
    const { value, error } = this.state;

    return label ? (
      <InputContainer label={label}>
        <MaterialInput type={type} {...rest} value={value} onChange={this.onChange} error={error} />
      </InputContainer>
    ) : (
      <MaterialInput type={type} {...rest} value={value} onChange={this.onChange} error={error} />
    );
  }
}
