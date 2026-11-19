// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';

import PlacementOrdering from './placement-ordering.js';

class Main extends React.Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    session: PropTypes.oneOfType([PropTypes.array.isRequired, PropTypes.object.isRequired]),
    onSessionChange: PropTypes.func.isRequired,
    /** The locale the chrome follows; the item's declared language when omitted. */
    language: PropTypes.string,
  };

  render() {
    const { model, session, onSessionChange, language } = this.props;

    return (
      <PlacementOrdering model={model} session={session} onSessionChange={onSessionChange} language={language} />
    );
  }
}

export default Main;
