/**
 * PIE Default Themes
 *
 * Provides default light and dark themes with PIE branding.
 * PIE brand color: Orange (#FF6F00 / orange[800])
 *
 * These themes provide good defaults while remaining fully customizable.
 */

import type { PieThemeExtended } from './types.js';

/**
 * PIE Orange - Primary brand color
 */
export const PIE_ORANGE = '#FF6F00';

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
  'primary-light': '#FFA726',
  'primary-dark': '#E65100',
  'faded-primary': '#FFF3E0',

  // Secondary colors (blue)
  secondary: '#1E88E5',
  'secondary-light': '#64B5F6',
  'secondary-dark': '#1565C0',

  // Tertiary colors (indigo)
  tertiary: '#3949AB',
  'tertiary-light': '#9FA8DA',

  // Status colors - Correct (green)
  success: '#43A047',
  'correct-secondary': '#E8F5E9',
  'correct-tertiary': '#388E3C',
  'correct-icon': '#2E7D32',

  // Status colors - Incorrect (red)
  error: '#E53935',
  'incorrect-secondary': '#FFEBEE',
  'incorrect-icon': '#C62828',

  // Status colors - Missing/Warning (amber)
  warning: '#F57C00',
  'missing-icon': '#757575',

  // Disabled states
  disabled: '#9E9E9E',
  'disabled-secondary': '#E0E0E0',

  // Backgrounds
  'background-dark': '#F5F5F5',
  'secondary-background': '#FAFAFA',
  'dropdown-background': '#ffffff',

  // Borders
  border: '#BDBDBD',
  'border-light': '#E0E0E0',
  'border-dark': '#757575',
  'border-gray': '#9E9E9E',

  // Focus states
  'focus-checked': '#BBDEFB',
  'focus-checked-border': '#1976D2',
  'focus-unchecked': '#E0E0E0',
  'focus-unchecked-border': '#757575',

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
  'choice-input-disabled-color': '#9E9E9E',
  'feedback-correct-bg': '#E8F5E9',
  'feedback-incorrect-bg': '#FFEBEE',
  'annotation-pointer-border-color': '#81C784',
  'arrow-color': '#FB8C00',
  'tick-color': '#616161',
  'line-stroke': '#BDBDBD',
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
  primary: '#FF9800',
  'primary-light': '#FFB74D',
  'primary-dark': '#F57C00',
  'faded-primary': '#E6510040',

  // Secondary colors (cyan)
  secondary: '#42A5F5',
  'secondary-light': '#90CAF9',
  'secondary-dark': '#1E88E5',

  // Tertiary colors (indigo)
  tertiary: '#5C6BC0',
  'tertiary-light': '#7986CB',

  // Status colors - Correct (green)
  success: '#4CAF50',
  'correct-secondary': '#1B5E2040',
  'correct-tertiary': '#43A047',
  'correct-icon': '#66BB6A',

  // Status colors - Incorrect (red)
  error: '#F44336',
  'incorrect-secondary': '#B71C1C40',
  'incorrect-icon': '#EF5350',

  // Status colors - Missing/Warning
  warning: '#FB8C00',
  'missing-icon': '#9E9E9E',

  // Disabled states
  disabled: '#757575',
  'disabled-secondary': '#424242',

  // Backgrounds
  'background-dark': '#0f1419', // Very dark background
  'secondary-background': '#2d3748', // Medium dark background
  'dropdown-background': '#2d3748',

  // Borders
  border: '#616161',
  'border-light': '#424242',
  'border-dark': '#9E9E9E',
  'border-gray': '#757575',

  // Focus states
  'focus-checked': '#0D47A1',
  'focus-checked-border': '#2196F3',
  'focus-unchecked': '#424242',
  'focus-unchecked-border': '#9E9E9E',

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
  'choice-input-selected-color': '#FF9800',
  'choice-input-disabled-color': '#757575',
  'feedback-correct-bg': '#1B5E2080',
  'feedback-incorrect-bg': '#B71C1C80',
  'annotation-pointer-border-color': '#43A047',
  'arrow-color': '#FF9800',
  'tick-color': '#E0E0E0',
  'line-stroke': '#757575',
  'point-fill': '#FF9800',
  'point-stroke': '#212121',
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
