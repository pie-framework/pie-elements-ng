import type { PieTheme } from '@pie-element/shared-types';
import type { PieThemeExtended } from '@pie-element/shared-theming';
import { lighten, darken, rgba } from './colors.js';

/**
 * Convert DaisyUI theme to extended PIE theme
 * Derives 45+ PIE colors from 12 DaisyUI base colors
 *
 * Uses simple color math (lighten, darken, rgba) to derive:
 * - Primary/secondary/tertiary variants (light, dark, faded)
 * - Correct/incorrect/missing variants (secondary, tertiary, icon)
 * - Disabled, border, focus states
 * - Blue-grey palette
 *
 * @param daisyTheme - Base DaisyUI theme (12 colors)
 * @returns Extended PIE theme (45+ colors)
 *
 * @example
 * ```typescript
 * const daisyTheme = extractDaisyUiTheme();
 * const pieTheme = daisyUiToPieTheme(daisyTheme);
 * // pieTheme now has all 45+ colors with derived variants
 * ```
 */
export function daisyUiToPieTheme(daisyTheme: PieTheme): PieThemeExtended {
  const pieTheme: PieThemeExtended = {
    // Direct mappings from DaisyUI (12 base colors)
    ...daisyTheme,
  };

  // Derive primary color variants
  if (daisyTheme.primary) {
    pieTheme['primary-light'] = lighten(daisyTheme.primary, 0.3);
    pieTheme['primary-dark'] = darken(daisyTheme.primary, 0.3);
    pieTheme['faded-primary'] = rgba(daisyTheme.primary, 0.15);
  }

  // Derive secondary color variants
  if (daisyTheme.secondary) {
    pieTheme['secondary-light'] = lighten(daisyTheme.secondary, 0.3);
    pieTheme['secondary-dark'] = darken(daisyTheme.secondary, 0.3);
  }

  // Derive tertiary colors from secondary or primary
  if (daisyTheme.secondary) {
    pieTheme.tertiary = darken(daisyTheme.secondary, 0.1);
    pieTheme['tertiary-light'] = rgba(daisyTheme.secondary, 0.2);
  } else if (daisyTheme.primary) {
    pieTheme.tertiary = darken(daisyTheme.primary, 0.15);
    pieTheme['tertiary-light'] = rgba(daisyTheme.primary, 0.2);
  }

  // Derive correct (success) color variants
  if (daisyTheme.success) {
    pieTheme['correct-secondary'] = rgba(daisyTheme.success, 0.1);
    pieTheme['correct-tertiary'] = darken(daisyTheme.success, 0.1);
    pieTheme['correct-icon'] = darken(daisyTheme.success, 0.2);
  }

  // Derive incorrect (error) color variants
  if (daisyTheme.error) {
    pieTheme.incorrect = daisyTheme.error;
    pieTheme['incorrect-secondary'] = rgba(daisyTheme.error, 0.1);
    pieTheme['incorrect-icon'] = darken(daisyTheme.error, 0.2);
  }

  // Derive missing (warning) color variants
  if (daisyTheme.warning) {
    pieTheme.missing = daisyTheme.warning;
    pieTheme['missing-icon'] = darken(daisyTheme.warning, 0.2);
  }

  // Derive disabled colors from neutral or base-300
  if (daisyTheme.neutral) {
    pieTheme.disabled = daisyTheme.neutral;
    pieTheme['disabled-secondary'] = lighten(daisyTheme.neutral, 0.2);
  } else if (daisyTheme['base-300']) {
    pieTheme.disabled = daisyTheme['base-300'];
    pieTheme['disabled-secondary'] = lighten(daisyTheme['base-300'], 0.2);
  }

  // Derive border colors from neutral
  if (daisyTheme.neutral) {
    pieTheme.border = daisyTheme.neutral;
    pieTheme['border-light'] = lighten(daisyTheme.neutral, 0.3);
    pieTheme['border-dark'] = darken(daisyTheme.neutral, 0.3);
    pieTheme['border-gray'] = daisyTheme.neutral;
  }

  // Derive background colors from base-200
  if (daisyTheme['base-200']) {
    pieTheme['background-dark'] = daisyTheme['base-200'];
    pieTheme['dropdown-background'] = darken(daisyTheme['base-200'], 0.05);
    pieTheme['secondary-background'] = daisyTheme['base-200'];
  }

  // Derive focus states from primary
  if (daisyTheme.primary) {
    pieTheme['focus-checked'] = rgba(daisyTheme.primary, 0.2);
    pieTheme['focus-checked-border'] = darken(daisyTheme.primary, 0.2);
  }

  // Derive unchecked focus states from neutral
  if (daisyTheme.neutral) {
    pieTheme['focus-unchecked'] = rgba(daisyTheme.neutral, 0.2);
    pieTheme['focus-unchecked-border'] = daisyTheme.neutral;
  }

  // Derive blue-grey palette from neutral or base-content
  const greyBase = daisyTheme.neutral || daisyTheme['base-content'] || '#7E8494';
  pieTheme['blue-grey-100'] = lighten(greyBase, 0.5);
  pieTheme['blue-grey-300'] = lighten(greyBase, 0.3);
  pieTheme['blue-grey-600'] = greyBase;
  pieTheme['blue-grey-900'] = darken(greyBase, 0.4);

  // Set black and white
  pieTheme.black = '#000000';
  pieTheme.white = '#ffffff';

  // Derive component-specific variables from base theme colors
  // Choice inputs
  if (daisyTheme['base-content']) {
    pieTheme['choice-input-color'] = daisyTheme['base-content'];
  }
  if (daisyTheme.primary) {
    pieTheme['choice-input-selected-color'] = daisyTheme.primary;
  }
  if (pieTheme.disabled) {
    pieTheme['choice-input-disabled-color'] = pieTheme.disabled;
  }

  // Feedback backgrounds
  if (daisyTheme.success) {
    pieTheme['feedback-correct-bg'] = rgba(daisyTheme.success, 0.1);
  }
  if (daisyTheme.error) {
    pieTheme['feedback-incorrect-bg'] = rgba(daisyTheme.error, 0.1);
  }

  // Annotations
  if (daisyTheme.success) {
    pieTheme['annotation-pointer-border-color'] = lighten(daisyTheme.success, 0.2);
  }
  pieTheme['annotation-pointer-right'] = '100%';
  pieTheme['annotation-pointer-top'] = '5px';
  pieTheme['annotation-pointer-border-width'] = '7px';

  // Number line / graphing
  if (daisyTheme.error) {
    pieTheme['arrow-color'] = daisyTheme.error;
  }
  if (daisyTheme.primary) {
    pieTheme['point-fill'] = daisyTheme.primary;
  }
  // Detect if dark theme for appropriate colors
  const isDark = isDarkTheme(daisyTheme);
  pieTheme['tick-color'] = isDark ? lighten(greyBase, 0.4) : darken(greyBase, 0.4);
  pieTheme['line-stroke'] = isDark ? lighten(greyBase, 0.2) : greyBase;
  pieTheme['point-stroke'] = isDark ? darken(greyBase, 0.5) : '#ffffff';
  pieTheme['correct-answer-toggle-label-color'] = daisyTheme['base-content'] || '#000000';

  // Primary text (nested fallback)
  if (daisyTheme['base-content']) {
    pieTheme['primary-text'] = daisyTheme['base-content'];
  }

  return pieTheme;
}

/**
 * Convert PIE theme back to DaisyUI theme
 * Extracts the 12 base DaisyUI colors from extended PIE theme
 *
 * @param pieTheme - Extended PIE theme
 * @returns Base DaisyUI theme (12 colors)
 *
 * @example
 * ```typescript
 * const pieTheme = { primary: '#3F51B5', 'base-content': '#000', ... };
 * const daisyTheme = pieThemeToDaisyUi(pieTheme);
 * // daisyTheme has only the 12 base colors
 * ```
 */
export function pieThemeToDaisyUi(pieTheme: Partial<PieThemeExtended>): PieTheme {
  return {
    primary: pieTheme.primary,
    secondary: pieTheme.secondary,
    accent: pieTheme.accent,
    neutral: pieTheme.neutral,
    'base-100': pieTheme['base-100'],
    'base-200': pieTheme['base-200'],
    'base-300': pieTheme['base-300'],
    'base-content': pieTheme['base-content'],
    info: pieTheme.info,
    success: pieTheme.success,
    warning: pieTheme.warning,
    error: pieTheme.error,
  };
}

/**
 * Check if a theme is dark based on base-content color
 * Heuristic: if base-content is light colored, theme is probably dark
 *
 * @param theme - PIE or DaisyUI theme
 * @returns True if theme appears to be dark
 *
 * @example
 * ```typescript
 * const theme = extractDaisyUiTheme();
 * if (isDarkTheme(theme)) {
 *   console.log('Dark mode active');
 * }
 * ```
 */
export function isDarkTheme(theme: Partial<PieTheme>): boolean {
  const baseContent = theme['base-content'];
  if (!baseContent) {
    return false;
  }

  // Simple heuristic: if base-content starts with rgb and has high values, it's light text (dark theme)
  const rgbMatch = baseContent.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const brightness = (r + g + b) / 3;
    return brightness > 128; // Light text = dark theme
  }

  return false;
}
