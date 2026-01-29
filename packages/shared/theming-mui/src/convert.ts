import type { PieThemeExtended } from '@pie-element/theming';
import { lighten, darken, rgba } from '@pie-element/theming-daisyui';

/**
 * Convert MUI theme to extended PIE theme with derived colors
 * Takes base MUI colors and derives all 45+ PIE-specific colors
 *
 * @param muiTheme - Base MUI/PIE theme (12-16 colors)
 * @returns Extended PIE theme (45+ colors)
 *
 * @example
 * ```typescript
 * import { useTheme } from '@mui/material/styles';
 * import { extractMuiTheme } from './extract';
 *
 * function MyComponent() {
 *   const muiTheme = useTheme();
 *   const basePieTheme = extractMuiTheme(muiTheme);
 *   const extendedPieTheme = muiToPieTheme(basePieTheme);
 *   // Now has all 45+ colors
 * }
 * ```
 */
export function muiToPieTheme(muiTheme: Partial<PieThemeExtended>): PieThemeExtended {
  const pieTheme: PieThemeExtended = {
    // Direct mappings
    ...muiTheme,
  };

  // Primary variants (if not already present from MUI)
  if (muiTheme.primary && !pieTheme['primary-light']) {
    pieTheme['primary-light'] = lighten(muiTheme.primary, 0.3);
  }
  if (muiTheme.primary && !pieTheme['primary-dark']) {
    pieTheme['primary-dark'] = darken(muiTheme.primary, 0.3);
  }
  if (muiTheme.primary) {
    pieTheme['faded-primary'] = rgba(muiTheme.primary, 0.15);
  }

  // Secondary variants (if not already present)
  if (muiTheme.secondary && !pieTheme['secondary-light']) {
    pieTheme['secondary-light'] = lighten(muiTheme.secondary, 0.3);
  }
  if (muiTheme.secondary && !pieTheme['secondary-dark']) {
    pieTheme['secondary-dark'] = darken(muiTheme.secondary, 0.3);
  }

  // Derive correct (success) variants
  if (muiTheme.success) {
    pieTheme['correct-secondary'] = rgba(muiTheme.success, 0.1);
    pieTheme['correct-tertiary'] = darken(muiTheme.success, 0.1);
    pieTheme['correct-icon'] = darken(muiTheme.success, 0.2);
  }

  // Derive incorrect (error) variants
  if (muiTheme.error) {
    pieTheme.incorrect = muiTheme.error;
    pieTheme['incorrect-secondary'] = rgba(muiTheme.error, 0.1);
    pieTheme['incorrect-icon'] = darken(muiTheme.error, 0.2);
  }

  // Derive missing (warning) variants
  if (muiTheme.warning) {
    pieTheme.missing = muiTheme.warning;
    pieTheme['missing-icon'] = darken(muiTheme.warning, 0.2);
  }

  // Derive disabled, borders from neutral
  if (muiTheme.neutral) {
    pieTheme.disabled = muiTheme.neutral;
    pieTheme['disabled-secondary'] = lighten(muiTheme.neutral, 0.2);
    pieTheme.border = muiTheme.neutral;
    pieTheme['border-light'] = lighten(muiTheme.neutral, 0.3);
    pieTheme['border-dark'] = darken(muiTheme.neutral, 0.3);
    pieTheme['border-gray'] = muiTheme.neutral;
  }

  // Derive accent/tertiary from secondary or primary
  if (muiTheme.secondary) {
    pieTheme.accent = muiTheme.secondary;
    pieTheme.tertiary = darken(muiTheme.secondary, 0.1);
    pieTheme['tertiary-light'] = rgba(muiTheme.secondary, 0.2);
  } else if (muiTheme.primary) {
    pieTheme.accent = muiTheme.primary;
    pieTheme.tertiary = darken(muiTheme.primary, 0.15);
    pieTheme['tertiary-light'] = rgba(muiTheme.primary, 0.2);
  }

  // Derive backgrounds
  if (muiTheme['base-200']) {
    pieTheme['background-dark'] = muiTheme['base-200'];
    pieTheme['dropdown-background'] = darken(muiTheme['base-200'], 0.05);
    pieTheme['secondary-background'] = muiTheme['base-200'];
  }

  // Derive focus states
  if (muiTheme.primary) {
    pieTheme['focus-checked'] = rgba(muiTheme.primary, 0.2);
    pieTheme['focus-checked-border'] = darken(muiTheme.primary, 0.2);
  }

  if (muiTheme.neutral) {
    pieTheme['focus-unchecked'] = rgba(muiTheme.neutral, 0.2);
    pieTheme['focus-unchecked-border'] = muiTheme.neutral;

    // Blue-grey palette from neutral
    pieTheme['blue-grey-100'] = lighten(muiTheme.neutral, 0.5);
    pieTheme['blue-grey-300'] = lighten(muiTheme.neutral, 0.3);
    pieTheme['blue-grey-600'] = muiTheme.neutral;
    pieTheme['blue-grey-900'] = darken(muiTheme.neutral, 0.4);
  }

  // Set black and white
  pieTheme.black = '#000000';
  pieTheme.white = '#ffffff';

  return pieTheme;
}
