// @ts-nocheck
/**
 * @synced-from pie-elements/packages/placement-ordering/src/main.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
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

import PlacementOrdering from './placement-ordering';

class Main extends React.Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    session: PropTypes.oneOfType([PropTypes.array.isRequired, PropTypes.object.isRequired]),
    onSessionChange: PropTypes.func.isRequired,
  };

  render() {
    const { model, session, onSessionChange } = this.props;

    return (
      <PlacementOrdering model={model} session={session} onSessionChange={onSessionChange} />
    );
  }
}

export default Main;
