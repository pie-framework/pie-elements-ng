import type { PieTheme } from '@pie-element/shared-types';
import type { PieThemeExtended } from '@pie-element/shared-theming';
import { darken, lighten, rgba } from './colors.js';

export function daisyUiToPieTheme(daisyTheme: PieTheme): PieThemeExtended {
  const pieTheme: PieThemeExtended = { ...daisyTheme };

  if (daisyTheme.primary) {
    pieTheme['primary-light'] = lighten(daisyTheme.primary, 0.3);
    pieTheme['primary-dark'] = darken(daisyTheme.primary, 0.3);
    pieTheme['faded-primary'] = rgba(daisyTheme.primary, 0.15);
  }
  if (daisyTheme.secondary) {
    pieTheme['secondary-light'] = lighten(daisyTheme.secondary, 0.3);
    pieTheme['secondary-dark'] = darken(daisyTheme.secondary, 0.3);
    pieTheme.tertiary = darken(daisyTheme.secondary, 0.1);
    pieTheme['tertiary-light'] = rgba(daisyTheme.secondary, 0.2);
  } else if (daisyTheme.primary) {
    pieTheme.tertiary = darken(daisyTheme.primary, 0.15);
    pieTheme['tertiary-light'] = rgba(daisyTheme.primary, 0.2);
  }

  if (daisyTheme.success) {
    pieTheme['correct-secondary'] = rgba(daisyTheme.success, 0.1);
    pieTheme['correct-tertiary'] = darken(daisyTheme.success, 0.1);
    pieTheme['correct-icon'] = darken(daisyTheme.success, 0.2);
    pieTheme['feedback-correct-bg'] = rgba(daisyTheme.success, 0.1);
    pieTheme['annotation-pointer-border-color'] = lighten(daisyTheme.success, 0.2);
  }
  if (daisyTheme.error) {
    pieTheme.incorrect = daisyTheme.error;
    pieTheme['incorrect-secondary'] = rgba(daisyTheme.error, 0.1);
    pieTheme['incorrect-icon'] = darken(daisyTheme.error, 0.2);
    pieTheme['feedback-incorrect-bg'] = rgba(daisyTheme.error, 0.1);
    pieTheme['arrow-color'] = daisyTheme.error;
  }
  if (daisyTheme.warning) {
    pieTheme.missing = daisyTheme.warning;
    pieTheme['missing-icon'] = darken(daisyTheme.warning, 0.2);
  }

  if (daisyTheme.neutral) {
    pieTheme.disabled = daisyTheme.neutral;
    pieTheme['disabled-secondary'] = lighten(daisyTheme.neutral, 0.2);
    pieTheme.border = daisyTheme.neutral;
    pieTheme['border-light'] = lighten(daisyTheme.neutral, 0.3);
    pieTheme['border-dark'] = darken(daisyTheme.neutral, 0.3);
    pieTheme['border-gray'] = daisyTheme.neutral;
  } else if (daisyTheme['base-300']) {
    pieTheme.disabled = daisyTheme['base-300'];
    pieTheme['disabled-secondary'] = lighten(daisyTheme['base-300'], 0.2);
  }

  if (daisyTheme['base-200']) {
    pieTheme['background-dark'] = daisyTheme['base-200'];
    pieTheme['dropdown-background'] = darken(daisyTheme['base-200'], 0.05);
    pieTheme['secondary-background'] = daisyTheme['base-200'];
  }

  if (daisyTheme.primary) {
    pieTheme['focus-checked'] = rgba(daisyTheme.primary, 0.2);
    pieTheme['focus-checked-border'] = darken(daisyTheme.primary, 0.2);
  }
  if (daisyTheme.neutral) {
    pieTheme['focus-unchecked'] = rgba(daisyTheme.neutral, 0.2);
    pieTheme['focus-unchecked-border'] = daisyTheme.neutral;
  }

  const greyBase = daisyTheme.neutral || daisyTheme['base-content'] || '#7E8494';
  pieTheme['blue-grey-100'] = lighten(greyBase, 0.5);
  pieTheme['blue-grey-300'] = lighten(greyBase, 0.3);
  pieTheme['blue-grey-600'] = greyBase;
  pieTheme['blue-grey-900'] = darken(greyBase, 0.4);
  pieTheme.black = '#000000';
  pieTheme.white = '#ffffff';

  if (daisyTheme['base-content']) pieTheme['choice-input-color'] = daisyTheme['base-content'];
  if (daisyTheme.primary) pieTheme['choice-input-selected-color'] = daisyTheme.primary;
  if (pieTheme.disabled) pieTheme['choice-input-disabled-color'] = pieTheme.disabled;
  if (daisyTheme.primary) pieTheme['point-fill'] = daisyTheme.primary;

  const isDark = isDarkTheme(daisyTheme);
  pieTheme['tick-color'] = isDark ? lighten(greyBase, 0.4) : darken(greyBase, 0.4);
  pieTheme['line-stroke'] = isDark ? lighten(greyBase, 0.2) : greyBase;
  pieTheme['point-stroke'] = isDark ? darken(greyBase, 0.5) : '#ffffff';
  pieTheme['correct-answer-toggle-label-color'] = daisyTheme['base-content'] || '#000000';
  if (daisyTheme['base-content']) pieTheme['primary-text'] = daisyTheme['base-content'];

  pieTheme['annotation-pointer-right'] = '100%';
  pieTheme['annotation-pointer-top'] = '5px';
  pieTheme['annotation-pointer-border-width'] = '7px';

  return pieTheme;
}

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

export function isDarkTheme(theme: Partial<PieTheme>): boolean {
  const baseContent = theme['base-content'];
  if (!baseContent) return false;
  const rgbMatch = baseContent.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!rgbMatch) return false;
  const brightness =
    (parseInt(rgbMatch[1], 10) + parseInt(rgbMatch[2], 10) + parseInt(rgbMatch[3], 10)) / 3;
  return brightness > 128;
}
