// @ts-nocheck
/**
 * @synced-from pie-lib/packages/mask-markup/src/choices/index.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { findKey } from 'lodash-es';
import Choice from './choice';
import { DragDroppablePlaceholder } from '@pie-lib/drag';

export default class Choices extends React.Component {
  static propTypes = {
    disabled: PropTypes.bool,
    duplicates: PropTypes.bool,
    choices: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, value: PropTypes.string })),
    value: PropTypes.object,
    choicePosition: PropTypes.string.isRequired,
    instanceId: PropTypes.string, // Added for drag isolation
  };

  getStyleForWrapper: any = () => {
    const { choicePosition } = this.props;

    switch (choicePosition) {
      case 'above':
        return {
          margin: '0 0 40px 0',
        };

      case 'below':
        return {
          margin: '40px 0 0 0',
        };

      case 'right':
        return {
          margin: '0 0 0 40px',
        };

      default:
        return {
          margin: '0 40px 0 0',
        };
    }
  };

  render() {
    const { disabled, duplicates, choices, value, instanceId } = this.props;
    const filteredChoices = choices.filter((c) => {
      if (duplicates === true) {
        return true;
      }
      const foundChoice = findKey(value, (v) => v === c.id);
      return foundChoice === undefined;
    });
    const elementStyle = { ...this.getStyleForWrapper(), minWidth: '100px' };

    return (
      <div style={elementStyle}>
        <DragDroppablePlaceholder disabled={disabled} instanceId={instanceId}>
          {filteredChoices.map((c, index) => (
            <Choice 
              key={`${c.value}-${index}`} 
              disabled={disabled} 
              choice={c} 
              instanceId={instanceId}
            />
          ))}
        </DragDroppablePlaceholder>
      </div>
    );
  }
}
