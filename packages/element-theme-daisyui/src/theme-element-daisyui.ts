import { PieElementThemeElement } from '@pie-element/element-theme';

export class PieElementThemeDaisyUiElement extends PieElementThemeElement {
  protected resolveDataTheme(themeName: 'light' | 'dark'): string {
    return themeName;
  }
}

export function definePieElementThemeDaisyUi() {
  if (typeof customElements === 'undefined') {
    return;
  }
  if (!customElements.get('pie-element-theme-daisyui')) {
    customElements.define('pie-element-theme-daisyui', PieElementThemeDaisyUiElement);
  }
}
