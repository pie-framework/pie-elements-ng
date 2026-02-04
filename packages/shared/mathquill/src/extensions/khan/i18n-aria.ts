/**
 * Internationalized ARIA Strings (Khan Academy)
 *
 * Source: Khan/mathquill@v1.0.3
 * PR: https://github.com/Khan/mathquill/pull/23
 * File: src/services/aria.ts
 *
 * Allows ARIA strings to be overridden for different languages.
 * This is critical for accessibility in non-English locales.
 *
 * Khan Academy uses this to provide screen reader support in
 * multiple languages for their international audience.
 */

export interface AriaStrings {
  before?: (obj: string) => string;
  after?: (obj: string) => string;
  'beginning of'?: (obj: string) => string;
  'end of'?: (obj: string) => string;
  Baseline?: string;
  Superscript?: string;
  Subscript?: string;
  selected?: (obj: string) => string;
  'no answer'?: string;
  'nothing selected'?: string;
  'nothing to the right'?: string;
  'nothing to the left'?: string;
  'block is empty'?: string;
  'nothing above'?: string;
  'nothing below'?: string;
  labelValue?: (label: string, value: string) => string;
}

/**
 * Helper function to setup internationalized ARIA strings for a MathField
 */
export function setupI18nAria(
  mathField: any,
  strings: AriaStrings
): void {
  // Khan Academy's i18n ARIA support is built into Desmos/Khan fork
  // The API should be: mathField.setAriaStringsOverrideMap(stringsMap)
  
  if (typeof mathField.setAriaStringsOverrideMap === 'function') {
    mathField.setAriaStringsOverrideMap(strings);
  } else {
    console.warn('setAriaStringsOverrideMap not available on MathField');
  }
}

export function applyI18nAriaSupport(_MQ: any): void {
  // The i18n ARIA support is already built into the Desmos/Khan fork.
  // This function exists to document the feature and maintain consistency
  // with the extension loader pattern.
  //
  // Consumers can use setupI18nAria() helper to configure ARIA strings:
  //
  // Example:
  //   const field = MQ.MathField(element);
  //   setupI18nAria(field, {
  //     'before': (obj) => `antes de ${obj}`,
  //     'after': (obj) => `después de ${obj}`,
  //     // ... other translations
  //   });
}
