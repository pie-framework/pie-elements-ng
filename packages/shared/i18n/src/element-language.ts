/**
 * `lang` and `dir` for an element's own host, which wraps the item's authored content.
 *
 * Both are stamped only for a language the item declares in a usable tag. An item that declares
 * none, or declares something that is not a language tag (`Spanish`), leaves both off and inherits
 * the page's: imported content in another language often declares nothing, and a default would
 * assert English over it. pie-players' content-language design makes the same rule.
 *
 * Nothing here touches `document.documentElement`, which belongs to the page.
 */

import { canonicalLanguageTag } from './language-tags.js';
import { localeDirection } from './provider.js';
import type { TextDirection, Translator } from './types.js';

export { canonicalLanguageTag };

export interface LanguageAttributes {
  lang: string;
  dir: TextDirection;
}

/** `lang` and `dir` for an item that declares `language`; `undefined` when it declares none. */
export function elementLanguageAttributes(
  language: string | null | undefined
): LanguageAttributes | undefined {
  const declared = canonicalLanguageTag(language);
  return declared ? { lang: declared, dir: localeDirection(declared) } : undefined;
}

/**
 * `lang` and `dir` for a chrome root whose strings come from `i18n`: the locale they are served in,
 * which is English for a requested locale nothing ships. `undefined` when `requested` is not a
 * usable tag, so the root inherits.
 */
export function chromeLanguageAttributes(
  i18n: Pick<Translator, 'getLocale' | 'getDirection'>,
  requested: string | null | undefined
): LanguageAttributes | undefined {
  if (!canonicalLanguageTag(requested)) return undefined;
  const served = i18n.getLocale();
  return { lang: canonicalLanguageTag(served) ?? served, dir: i18n.getDirection() };
}

/** Stamp `lang` and `dir` for a declared language on the element's own host, and clear both otherwise. */
export function stampElementLanguage(host: Element, language: string | null | undefined): void {
  const attributes = elementLanguageAttributes(language);
  if (attributes) {
    host.setAttribute('lang', attributes.lang);
    host.setAttribute('dir', attributes.dir);
  } else {
    host.removeAttribute('lang');
    host.removeAttribute('dir');
  }
}
