import { generateCssVariables, getPieTheme } from '@pie-element/shared-theming';

type ThemeMode = 'light' | 'dark' | 'auto';
type ThemeScope = 'self' | 'document';

type VariableMap = Record<string, string>;
const HTMLElementBase =
  typeof HTMLElement === 'undefined' ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto';
}

function isScope(value: string | null): value is ThemeScope {
  return value === 'self' || value === 'document';
}

function parseVariableOverrides(value: unknown): VariableMap {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parseVariableOverrides(parsed);
    } catch {
      return {};
    }
  }

  if (typeof value !== 'object') {
    return {};
  }

  const out: VariableMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== 'string' || !key.startsWith('--')) {
      continue;
    }
    if (typeof raw === 'string') {
      out[key] = raw;
    } else if (typeof raw === 'number') {
      out[key] = String(raw);
    }
  }
  return out;
}

/**
 * Generic PIE theme wrapper.
 *
 * Scopes `--pie-*` CSS variables and optional `data-theme` to either itself
 * or the document root.
 */
export class PieElementThemeElement extends HTMLElementBase {
  static get observedAttributes() {
    return ['theme', 'scope', 'variables'];
  }

  private mediaQuery: MediaQueryList | null = null;
  private readonly onMediaChange = () => this.applyTheme();
  private previousKeys = new Set<string>();
  private variablesOverride: VariableMap = {};

  get theme(): ThemeMode {
    const value = this.getAttribute('theme');
    return isThemeMode(value) ? value : 'light';
  }

  set theme(value: ThemeMode) {
    this.setAttribute('theme', value);
  }

  get scope(): ThemeScope {
    const value = this.getAttribute('scope');
    return isScope(value) ? value : 'self';
  }

  set scope(value: ThemeScope) {
    this.setAttribute('scope', value);
  }

  get variables(): VariableMap {
    return { ...this.variablesOverride };
  }

  set variables(value: VariableMap) {
    this.variablesOverride = parseVariableOverrides(value);
    this.setAttribute('variables', JSON.stringify(this.variablesOverride));
    this.applyTheme();
  }

  connectedCallback() {
    this.setupAutoThemeListener();
    this.applyTheme();
  }

  disconnectedCallback() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.onMediaChange);
    }
    this.mediaQuery = null;

    if (this.scope === 'self') {
      this.clearPreviousKeys(this);
      this.removeAttribute('data-theme');
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) {
      return;
    }

    if (name === 'variables') {
      this.variablesOverride = parseVariableOverrides(newValue);
    }

    if (name === 'theme') {
      this.setupAutoThemeListener();
    }

    this.applyTheme();
  }

  protected resolveDataTheme(themeName: 'light' | 'dark'): string {
    return themeName;
  }

  protected getTarget(): HTMLElement {
    if (this.scope === 'document') {
      return document.documentElement;
    }
    return this;
  }

  protected applyTheme() {
    const effectiveTheme = this.resolveEffectiveTheme();
    const target = this.getTarget();
    const vars = {
      ...generateCssVariables(getPieTheme(effectiveTheme)),
      ...this.variablesOverride,
    };

    target.setAttribute('data-theme', this.resolveDataTheme(effectiveTheme));
    this.clearPreviousKeys(target);
    for (const [key, value] of Object.entries(vars as Record<string, string>)) {
      target.style.setProperty(key, value);
    }
    this.previousKeys = new Set(Object.keys(vars));
  }

  private resolveEffectiveTheme(): 'light' | 'dark' {
    if (this.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return this.theme;
  }

  private clearPreviousKeys(target: HTMLElement) {
    for (const key of this.previousKeys) {
      target.style.removeProperty(key);
    }
  }

  private setupAutoThemeListener() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.onMediaChange);
      this.mediaQuery = null;
    }

    if (this.theme === 'auto') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.onMediaChange);
    }
  }
}

export function definePieElementTheme() {
  if (typeof customElements === 'undefined') {
    return;
  }
  if (!customElements.get('pie-element-theme')) {
    customElements.define('pie-element-theme', PieElementThemeElement);
  }
}
