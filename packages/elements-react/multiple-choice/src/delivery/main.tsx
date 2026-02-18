// @ts-nocheck
/**
 * @synced-from pie-elements/packages/multiple-choice/src/main.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { PreviewLayout } from '@pie-lib/render-ui';
import MultipleChoice from './multiple-choice.js';

class Main extends React.Component {
  static propTypes = {
    model: PropTypes.object,
    session: PropTypes.object,
    options: PropTypes.object,
    onChoiceChanged: PropTypes.func,
    onShowCorrectToggle: PropTypes.func,
    extraCSSRules: PropTypes.shape({
      names: PropTypes.arrayOf(PropTypes.string),
      rules: PropTypes.string,
    }),
  };

  static defaultProps = {
    model: {},
    session: {},
  };

  render() {
    const { model, onChoiceChanged, session, onShowCorrectToggle, options } = this.props;
    const { extraCSSRules, fontSizeFactor } = model;

    // model.partLabel is a property used for ebsr
    return (
      <PreviewLayout extraCSSRules={extraCSSRules} fontSizeFactor={fontSizeFactor} classes={{}}>
        <MultipleChoice
          {...model}
          options={options}
          session={session}
          onChoiceChanged={onChoiceChanged}
          onShowCorrectToggle={onShowCorrectToggle}
        />
      </PreviewLayout>
    );
  }
}

export default Main;
