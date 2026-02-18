/**
 * PIE Default Themes
 *
 * Provides default light and dark themes with PIE branding.
 * PIE brand color: Orange (#FF6F00 / orange[800])
 *
 * These themes provide good defaults while remaining fully customizable.
 */

import { orange, green, red, grey, blue, indigo } from '@mui/material/colors';
import type { PieThemeExtended } from './types.js';

/**
 * PIE Orange - Primary brand color
 */
export const PIE_ORANGE = orange[800]; // #FF6F00

/**
 * PIE Light Theme
 *
 * A clean, professional light theme with PIE orange branding.
 * Designed for optimal readability and accessibility (WCAG AA compliant).
 */
export const PIE_LIGHT_THEME: Partial<PieThemeExtended> = {
  // Core text and backgrounds
  'base-content': '#1a202c', // Dark grey for text
  'base-100': '#ffffff', // White background
  'base-200': '#f7fafc', // Very light grey
  'base-300': '#e2e8f0', // Light grey for borders

  // PIE Brand colors (orange primary)
  primary: PIE_ORANGE, // #FF6F00
  'primary-light': orange[400], // #FFA726
  'primary-dark': orange[900], // #E65100
  'faded-primary': orange[50], // #FFF3E0

  // Secondary colors (blue)
  secondary: blue[600], // #1E88E5
  'secondary-light': blue[300], // #64B5F6
  'secondary-dark': blue[800], // #1565C0

  // Tertiary colors (indigo)
  tertiary: indigo[600], // #3949AB
  'tertiary-light': indigo[200], // #9FA8DA

  // Status colors - Correct (green)
  success: green[600], // #43A047
  'correct-secondary': green[50], // #E8F5E9
  'correct-tertiary': green[700], // #388E3C
  'correct-icon': green[800], // #2E7D32

  // Status colors - Incorrect (red)
  error: red[600], // #E53935
  'incorrect-secondary': red[50], // #FFEBEE
  'incorrect-icon': red[800], // #C62828

  // Status colors - Missing/Warning (amber)
  warning: orange[700], // #F57C00
  'missing-icon': grey[600], // #757575

  // Disabled states
  disabled: grey[500], // #9E9E9E
  'disabled-secondary': grey[300], // #E0E0E0

  // Backgrounds
  'background-dark': grey[100], // #F5F5F5
  'secondary-background': grey[50], // #FAFAFA
  'dropdown-background': '#ffffff',

  // Borders
  border: grey[400], // #BDBDBD
  'border-light': grey[300], // #E0E0E0
  'border-dark': grey[600], // #757575
  'border-gray': grey[500], // #9E9E9E

  // Focus states
  'focus-checked': blue[100], // #BBDEFB
  'focus-checked-border': blue[700], // #1976D2
  'focus-unchecked': grey[300], // #E0E0E0
  'focus-unchecked-border': grey[600], // #757575

  // Blue-grey palette
  'blue-grey-100': '#F3F5F7',
  'blue-grey-300': '#C0C3CF',
  'blue-grey-600': '#7E8494',
  'blue-grey-900': '#152452',

  // Absolute colors
  black: '#000000',
  white: '#ffffff',

  // Component-specific
  'choice-input-color': '#1a202c',
  'choice-input-selected-color': PIE_ORANGE,
  'choice-input-disabled-color': grey[500],
  'feedback-correct-bg': green[50],
  'feedback-incorrect-bg': red[50],
  'annotation-pointer-border-color': green[300],
  'arrow-color': orange[600],
  'tick-color': grey[700],
  'line-stroke': grey[400],
  'point-fill': PIE_ORANGE,
  'point-stroke': '#ffffff',
  'correct-answer-toggle-label-color': '#1a202c',
  'primary-text': '#1a202c',
};

/**
 * PIE Dark Theme
 *
 * A modern dark theme with PIE orange branding.
 * Designed for reduced eye strain and WCAG AA compliance in dark environments.
 */
export const PIE_DARK_THEME: Partial<PieThemeExtended> = {
  // Core text and backgrounds
  'base-content': '#e2e8f0', // Light grey for text
  'base-100': '#1a202c', // Dark blue-grey background
  'base-200': '#2d3748', // Medium dark grey
  'base-300': '#4a5568', // Medium grey for borders

  // PIE Brand colors (orange primary - brighter for dark mode)
  primary: orange[500], // #FF9800 (brighter than light theme)
  'primary-light': orange[300], // #FFB74D
  'primary-dark': orange[700], // #F57C00
  'faded-primary': orange[900] + '40', // #E65100 with opacity

  // Secondary colors (cyan)
  secondary: blue[400], // #42A5F5
  'secondary-light': blue[200], // #90CAF9
  'secondary-dark': blue[600], // #1E88E5

  // Tertiary colors (indigo)
  tertiary: indigo[400], // #5C6BC0
  'tertiary-light': indigo[300], // #7986CB

  // Status colors - Correct (green)
  success: green[500], // #4CAF50
  'correct-secondary': green[900] + '40', // #1B5E20 with opacity
  'correct-tertiary': green[600], // #43A047
  'correct-icon': green[400], // #66BB6A

  // Status colors - Incorrect (red)
  error: red[500], // #F44336
  'incorrect-secondary': red[900] + '40', // #B71C1C with opacity
  'incorrect-icon': red[400], // #EF5350

  // Status colors - Missing/Warning
  warning: orange[600], // #FB8C00
  'missing-icon': grey[500], // #9E9E9E

  // Disabled states
  disabled: grey[600], // #757575
  'disabled-secondary': grey[800], // #424242

  // Backgrounds
  'background-dark': '#0f1419', // Very dark background
  'secondary-background': '#2d3748', // Medium dark background
  'dropdown-background': '#2d3748',

  // Borders
  border: grey[700], // #616161
  'border-light': grey[800], // #424242
  'border-dark': grey[500], // #9E9E9E
  'border-gray': grey[600], // #757575

  // Focus states
  'focus-checked': blue[900], // #0D47A1
  'focus-checked-border': blue[500], // #2196F3
  'focus-unchecked': grey[800], // #424242
  'focus-unchecked-border': grey[500], // #9E9E9E

  // Blue-grey palette
  'blue-grey-100': '#37474F',
  'blue-grey-300': '#546E7A',
  'blue-grey-600': '#78909C',
  'blue-grey-900': '#ECEFF1',

  // Absolute colors
  black: '#000000',
  white: '#ffffff',

  // Component-specific
  'choice-input-color': '#e2e8f0',
  'choice-input-selected-color': orange[500],
  'choice-input-disabled-color': grey[600],
  'feedback-correct-bg': green[900] + '80', // With higher opacity for visibility
  'feedback-incorrect-bg': red[900] + '80',
  'annotation-pointer-border-color': green[600],
  'arrow-color': orange[500],
  'tick-color': grey[300],
  'line-stroke': grey[600],
  'point-fill': orange[500],
  'point-stroke': grey[900],
  'correct-answer-toggle-label-color': '#e2e8f0',
  'primary-text': '#e2e8f0',
};

/**
 * Get theme by name
 */
export function getPieTheme(theme: 'light' | 'dark'): Partial<PieThemeExtended> {
  return theme === 'dark' ? PIE_DARK_THEME : PIE_LIGHT_THEME;
}

/**
 * PIE theme names
 */
export const PIE_THEME_NAMES = ['light', 'dark'] as const;
export type PieThemeName = (typeof PIE_THEME_NAMES)[number];
