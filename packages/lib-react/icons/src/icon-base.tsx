// @ts-nocheck
/**
 * @synced-from pie-lib/packages/icons/src/icon-base.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { Circle, RoundFeedbackBox, Square, SquareFeedbackBox, IconRoot } from './icon-root';
import PropTypes from 'prop-types';
import React from 'react';

export default (Action, Emoji) => {
  class IconBase extends React.Component {
    static propTypes = {
      iconSet: PropTypes.oneOf(['emoji', 'check']),
      shape: PropTypes.oneOf(['round', 'square']),
      category: PropTypes.oneOf(['feedback', undefined]),
      open: PropTypes.bool,
      size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      fg: PropTypes.string,
      bg: PropTypes.string,
    };

    static defaultProps = {
      iconSet: 'check',
      shape: 'round',
      category: undefined,
      open: false,
      size: 30,
      fg: '#4aaf46',
      bg: '#f8ffe2',
    };

    render() {
      const { iconSet, shape, category, open, size, fg, bg } = this.props;

      const Foreground = iconSet === 'check' ? <Action fill={fg} /> : <Emoji fill={fg} />;
      const Background = iconSet === 'check' ? <Action fill={bg} /> : <Emoji fill={bg} />;

      const getBox = () => {
        if (category === 'feedback') {
          return shape === 'round' ? <RoundFeedbackBox fill={bg} /> : <SquareFeedbackBox fill={bg} />;
        } else {
          return shape === 'round' ? <Circle fill={bg} /> : <Square fill={bg} />;
        }
      };

      if (open) {
        return <IconRoot size={size}>{Background}</IconRoot>;
      }

      return (
        <IconRoot size={size}>
          {getBox()}
          {Foreground}
        </IconRoot>
      );
    }
  }

  return IconBase;
};
