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

import { localeDirection } from './provider.js';
import { toLanguageTag } from './language-tags.js';
import type { TextDirection } from './types.js';

export interface LanguageAttributes {
  lang: string;
  dir: TextDirection;
}

/** The canonical tag for a declared language, or `undefined` when it is not a usable tag. */
export function canonicalLanguageTag(language: string | null | undefined): string | undefined {
  const tag = toLanguageTag(language).split(/[.@]/)[0];
  // `Intl` accepts any 5-8 letter primary subtag, `Spanish` included; a language in use has an
  // ISO 639 code of two or three letters.
  if (!/^[a-z]{2,3}(-|$)/i.test(tag)) return undefined;
  try {
    return Intl.getCanonicalLocales(tag)[0];
  } catch {
    return undefined;
  }
}

/** `lang` and `dir` for an item that declares `language`; `undefined` when it declares none. */
export function elementLanguageAttributes(
  language: string | null | undefined
): LanguageAttributes | undefined {
  const declared = canonicalLanguageTag(language);
  return declared ? { lang: declared, dir: localeDirection(declared) } : undefined;
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
