// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/with-stateful-model.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';

const withStatefulModel = (Component) => {
  class Stateful extends React.Component {
    static propTypes = {
      model: PropTypes.object.isRequired,
      onChange: PropTypes.func.isRequired,
    };

    constructor(props) {
      super(props);
      this.state = {
        model: props.model,
      };
    }

    UNSAFE_componentWillReceiveProps(props) {
      this.setState({ model: props.model });
    }

    onChange: any = (model) => {
      this.setState({ model }, () => {
        this.props.onChange(this.state.model);
      });
    };

    render() {
      return <Component model={this.state.model} onChange={this.onChange} />;
    }
  }

  return Stateful;
};

export default withStatefulModel;
