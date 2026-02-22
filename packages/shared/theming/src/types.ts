import type { PieTheme } from '@pie-element/shared-types';

/**
 * Extended PIE theme with all 45+ color properties
 * Extends base PieTheme from shared-types
 */
export interface PieThemeExtended extends PieTheme {
  // Base semantic colors (from PieTheme)
  primary?: string;
  secondary?: string;
  accent?: string;
  success?: string; // Maps to PIE 'correct'
  error?: string; // Maps to PIE 'incorrect'
  warning?: string; // Maps to PIE 'missing'
  info?: string;
  neutral?: string;
  'base-content'?: string; // Maps to PIE 'text'
  'base-100'?: string; // Maps to PIE 'background'
  'base-200'?: string; // Maps to PIE 'background-dark'
  'base-300'?: string;

  // Extended PIE-specific colors (45+ total)
  disabled?: string;
  'disabled-secondary'?: string;
  'correct-secondary'?: string;
  'correct-tertiary'?: string;
  'correct-icon'?: string;
  incorrect?: string;
  'incorrect-secondary'?: string;
  'incorrect-icon'?: string;
  missing?: string;
  'missing-icon'?: string;
  'primary-light'?: string;
  'primary-dark'?: string;
  'secondary-light'?: string;
  'secondary-dark'?: string;
  tertiary?: string;
  'tertiary-light'?: string;
  'background-dark'?: string;
  'dropdown-background'?: string;
  'secondary-background'?: string;
  border?: string;
  'border-light'?: string;
  'border-dark'?: string;
  'border-gray'?: string;
  'faded-primary'?: string;
  'focus-checked'?: string;
  'focus-checked-border'?: string;
  'focus-unchecked'?: string;
  'focus-unchecked-border'?: string;
  'blue-grey-100'?: string;
  'blue-grey-300'?: string;
  'blue-grey-600'?: string;
  'blue-grey-900'?: string;
  black?: string;
  white?: string;

  // Component-specific colors (formerly ad-hoc, now formal)
  'choice-input-color'?: string;
  'choice-input-selected-color'?: string;
  'choice-input-disabled-color'?: string;
  'feedback-correct-bg'?: string;
  'feedback-incorrect-bg'?: string;
  'annotation-pointer-right'?: string;
  'annotation-pointer-top'?: string;
  'annotation-pointer-border-width'?: string;
  'annotation-pointer-border-color'?: string;
  'arrow-color'?: string;
  'tick-color'?: string;
  'line-stroke'?: string;
  'point-fill'?: string;
  'point-stroke'?: string;
  'correct-answer-toggle-label-color'?: string;
  'primary-text'?: string;
}

/**
 * CSS variable mapping configuration
 */
export interface CssVariableMapping {
  variableName: string; // e.g., '--pie-text'
  themeKey: keyof PieThemeExtended;
  fallback: string; // From PIE_COLOR_DEFAULTS
}

