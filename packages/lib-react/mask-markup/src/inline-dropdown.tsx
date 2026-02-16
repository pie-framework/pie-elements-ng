// @ts-nocheck
/**
 * @synced-from pie-lib/packages/mask-markup/src/inline-dropdown.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import Dropdown from './components/dropdown';
import { withMask } from './with-mask';

// eslint-disable-next-line react/display-name
export default withMask('dropdown', (props) => (node, data, onChange) => {
  const dataset = node.data ? node.data.dataset || {} : {};
  if (dataset.component === 'dropdown') {
    // eslint-disable-next-line react/prop-types
    const { choices, disabled, feedback, showCorrectAnswer } = props;
    const correctAnswer = choices && choices[dataset.id] && choices[dataset.id].find((c) => c.correct);
    const finalChoice = showCorrectAnswer ? correctAnswer && correctAnswer.value : data[dataset.id];

    return (
      <Dropdown
        key={`${node.type}-dropdown-${dataset.id}`}
        correct={feedback && feedback[dataset.id] && feedback[dataset.id] === 'correct'}
        disabled={disabled || showCorrectAnswer}
        value={finalChoice}
        correctValue={showCorrectAnswer ? correctAnswer && correctAnswer.label : undefined}
        id={dataset.id}
        onChange={onChange}
        choices={choices[dataset.id]}
        showCorrectAnswer={showCorrectAnswer}
        singleQuery={Object.keys(choices).length == 1}
      />
    );
  }
});
