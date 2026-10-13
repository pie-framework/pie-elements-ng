// @ts-nocheck

import { color } from '@pie-lib/render-ui';

// A MathQuill rule matched on the styled root itself or on a field nested inside it, one class
// above mathquill.css, so it wins wherever that stylesheet loads.
const inMathMode = (selector) => `&.mq-math-mode ${selector}, & .mq-math-mode ${selector}`;

/**
 * MathQuill's ink, which mathquill.css paints in black, #4d4d4d, grey and gray literals. The caret
 * and the bars take the field's text colour, and an unfocused field's border takes
 * --pie-border-dark. A focused field keeps MathQuill's focus border and glow.
 */
export const mqInkStyles = {
  '&.mq-editable-field .mq-cursor, & .mq-editable-field .mq-cursor': {
    borderLeftColor: 'currentColor',
  },
  '&.mq-editable-field:not(.mq-focused), & .mq-editable-field:not(.mq-focused)': {
    borderColor: color.borderDark(),
  },
  [[
    '.mq-overline .mq-overline-inner',
    '.mq-overarrow',
    '.mq-overarrow .mq-overarrow-inner',
    '.mq-overleftrightarrow .mq-overleftrightarrow-inner',
    '.mq-overarc',
    '.mq-longdiv .mq-longdiv-inner',
  ]
    .map(inMathMode)
    .join(', ')]: {
    borderTopColor: 'currentColor',
  },
  [['.mq-underline', '.mq-xarrow .mq-xarrow-over'].map(inMathMode).join(', ')]: {
    borderBottomColor: 'currentColor',
  },
  [inMathMode('.mq-abs')]: {
    borderLeftColor: 'currentColor',
    borderRightColor: 'currentColor',
  },
  [inMathMode('.mq-matrix td.mq-empty')]: {
    borderColor: 'currentColor',
  },
};

export const commonMqFontStyles = {
  fontFamily: 'MJXZERO, MJXTEX !important',
  '-webkit-font-smoothing': 'antialiased !important',

  '& .mq-math-mode > span > var': {
    fontFamily: 'MJXZERO, MJXTEX-I !important',
  },
  '& .mq-math-mode span var': {
    fontFamily: 'MJXZERO, MJXTEX-I !important',
  },
  '& .mq-math-mode .mq-nonSymbola': {
    fontFamily: 'MJXZERO, MJXTEX-I !important',
  },
  '& .mq-math-mode > span > var.mq-operator-name': {
    fontFamily: 'MJXZERO, MJXTEX !important',
  },
};

export const longdivStyles = {
  '& .mq-longdiv-inner': {
    marginTop: '-1px',
    marginLeft: '5px !important;',

    '& > .mq-empty': {
      padding: '0 !important',
      marginLeft: '0px !important',
      marginTop: '2px',
    },
  },

  '& .mq-math-mode .mq-longdiv': {
    display: 'inline-flex !important',
  },
};

export const supsubStyles = {
  '& .mq-math-mode sup.mq-nthroot': {
    fontSize: '70% !important',
    verticalAlign: '0.5em !important',
    paddingRight: '0.15em',
  },
  '& .mq-math-mode .mq-supsub': {
    fontSize: '70.7% !important',
  },
  '& .mq-supsub ': {
    fontSize: '70.7%',
  },
  '& .mq-math-mode .mq-supsub.mq-sup-only': {
    verticalAlign: '-0.1em !important',

    '& .mq-sup': {
      marginBottom: '0px !important',
    },
  },
  /* But when the base is a fraction, move it higher */
  '& .mq-math-mode .mq-fraction + .mq-supsub.mq-sup-only': {
    verticalAlign: '0.4em !important',
  },

  '& .mq-math-mode .mq-supsub.mq-sup-only.mq-after-fraction-group': {
    verticalAlign: '0.4em !important',
  },
};

export const commonMqKeyboardStyles = {
  '& *': {
    ...commonMqFontStyles,
    ...longdivStyles,
    '& .mq-math-mode .mq-sqrt-prefix': {
      top: '0 !important',
    },

    '& .mq-math-mode .mq-empty': {
      padding: '9px 1px !important',
    },

    '& .mq-math-mode .mq-longdiv-inner .mq-empty': {
      padding: '0 !important',
    },

    '& .mq-math-mode .mq-supsub': {
      fontSize: '70.7% !important',
    },

    '& .mq-math-mode .mq-sqrt-stem': {
      marginTop: '-5px',
      paddingTop: '4px',
    },

    '& .mq-math-mode .mq-paren': {
      verticalAlign: 'middle !important',
    },

    '& .mq-math-mode .mq-overarrow .mq-overarrow-inner .mq-empty': {
      padding: '0 !important',
    },

    '& .mq-math-mode .mq-overline .mq-overline-inner .mq-empty ': {
      padding: '0 !important',
    },
  },
};

export default {
  mqInkStyles,
  commonMqFontStyles,
  longdivStyles,
  supsubStyles,
  commonMqKeyboardStyles,
};
