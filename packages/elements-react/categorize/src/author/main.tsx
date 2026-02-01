// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/configure/src/main.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Design from './design';

export class Main extends React.Component {
  static propTypes = {
    configuration: PropTypes.object,
    onConfigurationChanged: PropTypes.func,
    model: PropTypes.object.isRequired,
    onModelChanged: PropTypes.func.isRequired,
    imageSupport: PropTypes.object,
    uploadSoundSupport: PropTypes.object,
  };

  static defaultProps = {};

  render() {
    const { model, onModelChanged, configuration, onConfigurationChanged, imageSupport, uploadSoundSupport } =
      this.props;

    return (
      <Design
        imageSupport={imageSupport}
        uploadSoundSupport={uploadSoundSupport}
        title="Design"
        model={model}
        configuration={configuration}
        onChange={onModelChanged}
        onConfigurationChanged={onConfigurationChanged}
      />
    );
  }
}

export default Main;
