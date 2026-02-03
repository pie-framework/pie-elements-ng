// @ts-nocheck
/**
 * @synced-from pie-elements/packages/matrix/src/Main.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { PreviewLayout } from '@pie-lib/render-ui';
import Matrix from './Matrix';

class Main extends React.Component {
  static propTypes = {
    model: PropTypes.object,
    session: PropTypes.object,
    onSessionChange: PropTypes.func,
  };

  static defaultProps = {
    model: {},
    session: {},
  };

  render() {
    const { model, onSessionChange, session } = this.props;
    const { extraCSSRules } = model;
    return (
      <PreviewLayout extraCSSRules={extraCSSRules}>
        <Matrix {...model} session={session} onSessionChange={onSessionChange} />
      </PreviewLayout>
    );
  }
}

export default Main;
