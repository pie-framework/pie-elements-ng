/**
 * PIE Color Defaults - All 45+ default color values
 * Copied from @pie-lib/render-ui/src/color.ts
 */
export const PIE_COLOR_DEFAULTS = {
  TEXT: 'black',
  DISABLED: 'grey',
  DISABLED_SECONDARY: '#ABABAB',
  CORRECT: '#4CAF50',
  CORRECT_SECONDARY: '#E8F5E9',
  CORRECT_TERTIARY: '#0EA449',
  CORRECT_WITH_ICON: '#087D38',
  INCORRECT: '#FF9800',
  INCORRECT_SECONDARY: '#FFEBEE',
  INCORRECT_WITH_ICON: '#BF0D00',
  MISSING: '#D32F2F',
  MISSING_WITH_ICON: '#6A78A1',
  PRIMARY: '#3F51B5',
  PRIMARY_LIGHT: '#9FA8DA',
  PRIMARY_DARK: '#283593',
  SECONDARY: '#F50057',
  SECONDARY_LIGHT: '#F48FB1',
  SECONDARY_DARK: '#880E4F',
  TERTIARY: '#146EB3',
  TERTIARY_LIGHT: '#D0E2F0',
  BACKGROUND: 'rgba(255,255,255,0)',
  BACKGROUND_DARK: '#ECEDF1',
  DROPDOWN_BACKGROUND: '#E0E1E6',
  SECONDARY_BACKGROUND: 'rgba(241,241,241,1)',
  BORDER: '#9A9A9A',
  BORDER_LIGHT: '#D1D1D1',
  BORDER_DARK: '#646464',
  BORDER_GRAY: '#7E8494',
  BLACK: '#000000',
  WHITE: '#ffffff',
  TRANSPARENT: 'transparent',
  FOCUS_CHECKED: '#BBDEFB',
  FOCUS_CHECKED_BORDER: '#1565C0',
  FOCUS_UNCHECKED: '#E0E0E0',
  FOCUS_UNCHECKED_BORDER: '#757575',
  BLUE_GREY100: '#F3F5F7',
  BLUE_GREY300: '#C0C3CF',
  BLUE_GREY600: '#7E8494',
  BLUE_GREY900: '#152452',
  FADED_PRIMARY: '#DCDAFB',

  // Component-specific colors (formerly ad-hoc, now formalized)
  // Choice inputs
  CHOICE_INPUT_COLOR: 'black', // References TEXT
  CHOICE_INPUT_SELECTED_COLOR: '#3F51B5',
  CHOICE_INPUT_DISABLED_COLOR: 'grey', // References DISABLED

  // Feedback
  FEEDBACK_CORRECT_BG: '#4CAF50',
  FEEDBACK_INCORRECT_BG: '#FF9800',

  // Annotations (extended-text-entry)
  ANNOTATION_POINTER_RIGHT: '100%',
  ANNOTATION_POINTER_TOP: '5px',
  ANNOTATION_POINTER_BORDER_WIDTH: '7px',
  ANNOTATION_POINTER_BORDER_COLOR: 'rgb(153, 255, 153)',

  // Number line / graphing
  ARROW_COLOR: '#FF9800',
  TICK_COLOR: '#ffffff',
  LINE_STROKE: '#ffffff',
  POINT_FILL: '#000000',
  POINT_STROKE: '#ffffff',
  CORRECT_ANSWER_TOGGLE_LABEL_COLOR: '#ffffff',

  // Utility
  PRIMARY_TEXT: 'black', // References TEXT
} as const;

/**
 * Default CSS variable mappings
 * Maps PieThemeExtended keys to --pie-* CSS variables with fallbacks
 */
export const DEFAULT_CSS_MAPPINGS = [
  // Core text and background
  {
    variableName: '--pie-text',
    themeKey: 'base-content' as const,
    fallback: PIE_COLOR_DEFAULTS.TEXT,
  },
  {
    variableName: '--pie-background',
    themeKey: 'base-100' as const,
    fallback: PIE_COLOR_DEFAULTS.BACKGROUND,
  },
  {
    variableName: '--pie-background-dark',
    themeKey: 'background-dark' as const,
    fallback: PIE_COLOR_DEFAULTS.BACKGROUND_DARK,
  },
  {
    variableName: '--pie-secondary-background',
    themeKey: 'secondary-background' as const,
    fallback: PIE_COLOR_DEFAULTS.SECONDARY_BACKGROUND,
  },
  {
    variableName: '--pie-dropdown-background',
    themeKey: 'dropdown-background' as const,
    fallback: PIE_COLOR_DEFAULTS.DROPDOWN_BACKGROUND,
  },

  // Primary colors
  {
    variableName: '--pie-primary',
    themeKey: 'primary' as const,
    fallback: PIE_COLOR_DEFAULTS.PRIMARY,
  },
  {
    variableName: '--pie-primary-light',
    themeKey: 'primary-light' as const,
    fallback: PIE_COLOR_DEFAULTS.PRIMARY_LIGHT,
  },
  {
    variableName: '--pie-primary-dark',
    themeKey: 'primary-dark' as const,
    fallback: PIE_COLOR_DEFAULTS.PRIMARY_DARK,
  },
  {
    variableName: '--pie-faded-primary',
    themeKey: 'faded-primary' as const,
    fallback: PIE_COLOR_DEFAULTS.FADED_PRIMARY,
  },

  // Secondary colors
  {
    variableName: '--pie-secondary',
    themeKey: 'secondary' as const,
    fallback: PIE_COLOR_DEFAULTS.SECONDARY,
  },
  {
    variableName: '--pie-secondary-light',
    themeKey: 'secondary-light' as const,
    fallback: PIE_COLOR_DEFAULTS.SECONDARY_LIGHT,
  },
  {
    variableName: '--pie-secondary-dark',
    themeKey: 'secondary-dark' as const,
    fallback: PIE_COLOR_DEFAULTS.SECONDARY_DARK,
  },

  // Tertiary colors
  {
    variableName: '--pie-tertiary',
    themeKey: 'tertiary' as const,
    fallback: PIE_COLOR_DEFAULTS.TERTIARY,
  },
  {
    variableName: '--pie-tertiary-light',
    themeKey: 'tertiary-light' as const,
    fallback: PIE_COLOR_DEFAULTS.TERTIARY_LIGHT,
  },

  // Correct (success) colors
  {
    variableName: '--pie-correct',
    themeKey: 'success' as const,
    fallback: PIE_COLOR_DEFAULTS.CORRECT,
  },
  {
    variableName: '--pie-correct-secondary',
    themeKey: 'correct-secondary' as const,
    fallback: PIE_COLOR_DEFAULTS.CORRECT_SECONDARY,
  },
  {
    variableName: '--pie-correct-tertiary',
    themeKey: 'correct-tertiary' as const,
    fallback: PIE_COLOR_DEFAULTS.CORRECT_TERTIARY,
  },
  {
    variableName: '--pie-correct-icon',
    themeKey: 'correct-icon' as const,
    fallback: PIE_COLOR_DEFAULTS.CORRECT_WITH_ICON,
  },

  // Incorrect (error) colors
  {
    variableName: '--pie-incorrect',
    themeKey: 'error' as const,
    fallback: PIE_COLOR_DEFAULTS.INCORRECT,
  },
  {
    variableName: '--pie-incorrect-secondary',
    themeKey: 'incorrect-secondary' as const,
    fallback: PIE_COLOR_DEFAULTS.INCORRECT_SECONDARY,
  },
  {
    variableName: '--pie-incorrect-icon',
    themeKey: 'incorrect-icon' as const,
    fallback: PIE_COLOR_DEFAULTS.INCORRECT_WITH_ICON,
  },

  // Missing (warning) colors
  {
    variableName: '--pie-missing',
    themeKey: 'warning' as const,
    fallback: PIE_COLOR_DEFAULTS.MISSING,
  },
  {
    variableName: '--pie-missing-icon',
    themeKey: 'missing-icon' as const,
    fallback: PIE_COLOR_DEFAULTS.MISSING_WITH_ICON,
  },

  // Disabled colors
  {
    variableName: '--pie-disabled',
    themeKey: 'disabled' as const,
    fallback: PIE_COLOR_DEFAULTS.DISABLED,
  },
  {
    variableName: '--pie-disabled-secondary',
    themeKey: 'disabled-secondary' as const,
    fallback: PIE_COLOR_DEFAULTS.DISABLED_SECONDARY,
  },

  // Border colors
  {
    variableName: '--pie-border',
    themeKey: 'border' as const,
    fallback: PIE_COLOR_DEFAULTS.BORDER,
  },
  {
    variableName: '--pie-border-light',
    themeKey: 'border-light' as const,
    fallback: PIE_COLOR_DEFAULTS.BORDER_LIGHT,
  },
  {
    variableName: '--pie-border-dark',
    themeKey: 'border-dark' as const,
    fallback: PIE_COLOR_DEFAULTS.BORDER_DARK,
  },
  {
    variableName: '--pie-border-gray',
    themeKey: 'border-gray' as const,
    fallback: PIE_COLOR_DEFAULTS.BORDER_GRAY,
  },

  // Focus states
  {
    variableName: '--pie-focus-checked',
    themeKey: 'focus-checked' as const,
    fallback: PIE_COLOR_DEFAULTS.FOCUS_CHECKED,
  },
  {
    variableName: '--pie-focus-checked-border',
    themeKey: 'focus-checked-border' as const,
    fallback: PIE_COLOR_DEFAULTS.FOCUS_CHECKED_BORDER,
  },
  {
    variableName: '--pie-focus-unchecked',
    themeKey: 'focus-unchecked' as const,
    fallback: PIE_COLOR_DEFAULTS.FOCUS_UNCHECKED,
  },
  {
    variableName: '--pie-focus-unchecked-border',
    themeKey: 'focus-unchecked-border' as const,
    fallback: PIE_COLOR_DEFAULTS.FOCUS_UNCHECKED_BORDER,
  },

  // Blue-grey palette
  {
    variableName: '--pie-blue-grey-100',
    themeKey: 'blue-grey-100' as const,
    fallback: PIE_COLOR_DEFAULTS.BLUE_GREY100,
  },
  {
    variableName: '--pie-blue-grey-300',
    themeKey: 'blue-grey-300' as const,
    fallback: PIE_COLOR_DEFAULTS.BLUE_GREY300,
  },
  {
    variableName: '--pie-blue-grey-600',
    themeKey: 'blue-grey-600' as const,
    fallback: PIE_COLOR_DEFAULTS.BLUE_GREY600,
  },
  {
    variableName: '--pie-blue-grey-900',
    themeKey: 'blue-grey-900' as const,
    fallback: PIE_COLOR_DEFAULTS.BLUE_GREY900,
  },

  // Base colors
  { variableName: '--pie-black', themeKey: 'black' as const, fallback: PIE_COLOR_DEFAULTS.BLACK },
  { variableName: '--pie-white', themeKey: 'white' as const, fallback: PIE_COLOR_DEFAULTS.WHITE },

  // Component-specific variables (formerly ad-hoc, now formalized for comprehensive theming)
  // Choice inputs (multiple-choice, likert, matrix)
  {
    variableName: '--choice-input-color',
    themeKey: 'choice-input-color' as const,
    fallback: PIE_COLOR_DEFAULTS.CHOICE_INPUT_COLOR,
  },
  {
    variableName: '--choice-input-selected-color',
    themeKey: 'choice-input-selected-color' as const,
    fallback: PIE_COLOR_DEFAULTS.CHOICE_INPUT_SELECTED_COLOR,
  },
  {
    variableName: '--choice-input-disabled-color',
    themeKey: 'choice-input-disabled-color' as const,
    fallback: PIE_COLOR_DEFAULTS.CHOICE_INPUT_DISABLED_COLOR,
  },

  // Feedback (multiple-choice, match-list)
  {
    variableName: '--feedback-correct-bg-color',
    themeKey: 'feedback-correct-bg' as const,
    fallback: PIE_COLOR_DEFAULTS.FEEDBACK_CORRECT_BG,
  },
  {
    variableName: '--feedback-incorrect-bg-color',
    themeKey: 'feedback-incorrect-bg' as const,
    fallback: PIE_COLOR_DEFAULTS.FEEDBACK_INCORRECT_BG,
  },

  // Annotations (extended-text-entry)
  {
    variableName: '--before-right',
    themeKey: 'annotation-pointer-right' as const,
    fallback: PIE_COLOR_DEFAULTS.ANNOTATION_POINTER_RIGHT,
  },
  {
    variableName: '--before-top',
    themeKey: 'annotation-pointer-top' as const,
    fallback: PIE_COLOR_DEFAULTS.ANNOTATION_POINTER_TOP,
  },
  {
    variableName: '--before-border-width',
    themeKey: 'annotation-pointer-border-width' as const,
    fallback: PIE_COLOR_DEFAULTS.ANNOTATION_POINTER_BORDER_WIDTH,
  },
  {
    variableName: '--before-border-color',
    themeKey: 'annotation-pointer-border-color' as const,
    fallback: PIE_COLOR_DEFAULTS.ANNOTATION_POINTER_BORDER_COLOR,
  },

  // Number line / graphing (number-line)
  {
    variableName: '--arrow-color',
    themeKey: 'arrow-color' as const,
    fallback: PIE_COLOR_DEFAULTS.ARROW_COLOR,
  },
  {
    variableName: '--tick-color',
    themeKey: 'tick-color' as const,
    fallback: PIE_COLOR_DEFAULTS.TICK_COLOR,
  },
  {
    variableName: '--line-stroke',
    themeKey: 'line-stroke' as const,
    fallback: PIE_COLOR_DEFAULTS.LINE_STROKE,
  },
  {
    variableName: '--point-fill',
    themeKey: 'point-fill' as const,
    fallback: PIE_COLOR_DEFAULTS.POINT_FILL,
  },
  {
    variableName: '--point-stroke',
    themeKey: 'point-stroke' as const,
    fallback: PIE_COLOR_DEFAULTS.POINT_STROKE,
  },
  {
    variableName: '--correct-answer-toggle-label-color',
    themeKey: 'correct-answer-toggle-label-color' as const,
    fallback: PIE_COLOR_DEFAULTS.CORRECT_ANSWER_TOGGLE_LABEL_COLOR,
  },

  // Utility
  {
    variableName: '--pie-primary-text',
    themeKey: 'primary-text' as const,
    fallback: PIE_COLOR_DEFAULTS.PRIMARY_TEXT,
  },
] as const;
