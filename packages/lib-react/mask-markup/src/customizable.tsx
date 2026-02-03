// @ts-nocheck
/**
 * @synced-from pie-lib/packages/mask-markup/src/customizable.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
// import Input from './components/input';
import { withMask } from './with-mask';

// eslint-disable-next-line react/display-name
export default withMask('input', (props) => (node, data, onChange) => {
  const dataset = node.data ? node.data.dataset || {} : {};
  if (dataset.component === 'input') {
    // eslint-disable-next-line react/prop-types
    // const { adjustedLimit, disabled, feedback, showCorrectAnswer, maxLength, spellCheck } = props;

    // the first answer is the correct one
    // eslint-disable-next-line react/prop-types
    // const correctAnswer = ((props.choices && dataset && props.choices[dataset.id]) || [])[0];
    // const finalValue = showCorrectAnswer ? correctAnswer && correctAnswer.label : data[dataset.id] || '';
    // const width = maxLength && maxLength[dataset.id];

    return props.customMarkMarkupComponent(dataset.id);
    // return (
    //   <Input
    //     key={`${node.type}-input-${dataset.id}`}
    //     correct={feedback && feedback[dataset.id] && feedback[dataset.id] === 'correct'}
    //     disabled={showCorrectAnswer || disabled}
    //     value={finalValue}
    //     id={dataset.id}
    //     onChange={onChange}
    //     showCorrectAnswer={showCorrectAnswer}
    //     width={width}
    //     charactersLimit={adjustedLimit ? width : 25}
    //     isConstructedResponse={true}
    //     spellCheck={spellCheck}
    //   />
    // );
  }
});
