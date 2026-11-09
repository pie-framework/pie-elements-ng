// @ts-nocheck

import Input from './input.js';
import Static from './static.js';
import CommonMqStyles, {
  commonMathLiveStyles,
  commonKeyboardStyles,
  commonMqFontStyles,
  commonMqKeyboardStyles,
  longdivStyles,
  rootIndexStyles,
  parallelStyles,
  supsubStyles,
  placeholderStyles,
} from './common-styles.js';

export {
  Input,
  Static,
  // Same object shape as @pie-lib/math-input's `mq.CommonMqStyles`, so
  // `const { commonMqFontStyles, ... } = mq.CommonMqStyles` keeps working.
  CommonMqStyles,
  commonMathLiveStyles,
  commonKeyboardStyles,
  commonMqFontStyles,
  commonMqKeyboardStyles,
  longdivStyles,
  rootIndexStyles,
  parallelStyles,
  supsubStyles,
  placeholderStyles,
};
