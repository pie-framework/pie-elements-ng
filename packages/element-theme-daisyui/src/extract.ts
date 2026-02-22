import type { PieTheme } from '@pie-element/shared-types';

export interface ExtractDaisyUiThemeOptions {
  element?: HTMLElement;
}

export function extractDaisyUiTheme(options?: ExtractDaisyUiThemeOptions): PieTheme | undefined {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return undefined;
  }

  try {
    const element = options?.element || document.documentElement;
    const rootStyles = getComputedStyle(element);
    const baseContent = rootStyles.color;
    const baseBackground = rootStyles.backgroundColor;

    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
    document.body.appendChild(tempDiv);

    const extract = (className: string, prop: 'color' | 'backgroundColor' = 'color'): string => {
      tempDiv.className = className;
      const computed = getComputedStyle(tempDiv);
      return computed[prop];
    };

    const theme: PieTheme = {
      'base-content': baseContent,
      'base-100': baseBackground,
      'base-200': extract('bg-base-200', 'backgroundColor'),
      'base-300': extract('bg-base-300', 'backgroundColor'),
      primary: extract('text-primary'),
      secondary: extract('text-secondary'),
      accent: extract('text-accent'),
      neutral: extract('text-neutral'),
      success: extract('text-success'),
      error: extract('text-error'),
      warning: extract('text-warning'),
      info: extract('text-info'),
    };

    document.body.removeChild(tempDiv);
    return theme;
  } catch {
    return undefined;
  }
}

export function watchDaisyUiTheme(
  callback: (theme: PieTheme | undefined) => void,
  options?: { element?: HTMLElement }
): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }

  const element = options?.element || document.documentElement;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        callback(extractDaisyUiTheme({ element }));
        break;
      }
    }
  });

  observer.observe(element, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

export function getDaisyUiThemeName(element?: HTMLElement): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const target = element || document.documentElement;
  return target.getAttribute('data-theme') || undefined;
}

export function setDaisyUiTheme(themeName: string, element?: HTMLElement): void {
  if (typeof document === 'undefined') return;
  const target = element || document.documentElement;
  target.setAttribute('data-theme', themeName);
}
