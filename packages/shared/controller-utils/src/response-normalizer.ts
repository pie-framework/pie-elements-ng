/**
 * Response Normalizer
 *
 * Folds a typed response and an authored answer to one comparable form, so that
 * the same answer typed with other digits, Arabic separators or a different
 * Unicode encoding compares equal. Controllers apply it inside the comparison
 * and store the response as entered.
 *
 * Nothing in an ASCII string is altered unless case folding is asked for, so
 * a response that compared equal or unequal before still does.
 */

import { canonicalLanguageTag } from '@pie-players/pie-language-tags';

export interface NormalizeOptions {
  /**
   * BCP 47 tag of the content language. Selects the decimal and group marks
   * that the Arabic separators fold to, and the case fold. Without one, the
   * marks are `.` and `,`, the form math.js and math-validation compute on.
   */
  language?: string;
  /** Fold case, with the Turkish and Azerbaijani i when the language is one of them. */
  ignoreCase?: boolean;
  /**
   * Fold Arabic spelling variants: hamza and madda alef forms to bare alef,
   * tashkeel removed, ة to ه and ى to ي. An authoring choice per response,
   * because it changes what counts as correct spelling.
   */
  foldLetterVariants?: boolean;
  /** Collapse each run of whitespace, non-breaking spaces included, to one space and trim the ends. */
  collapseWhitespace?: boolean;
  /** Remove whitespace around `/`, so `3 / 4` compares equal to `3/4`. */
  ignoreSlashSpacing?: boolean;
  /** Remove the combining diacritics U+0300–U+036F, so `é` compares equal to `e`. */
  ignoreAccents?: boolean;
  /**
   * Write numbers in the form math-validation computes on. `٫` becomes `.` and `٬` becomes `,`
   * whatever the language. Where the language's region writes a decimal comma (`es-ES`, `de-DE`),
   * a number's one `,` or `{,}`, also before a repeating `\overline`, becomes `.`, and `;` becomes
   * `, ` between list items, spaced so that math-validation does not read `(2;500)` as 2500. A `.`
   * stays a decimal point, and a number with two marks (`1.000,5`) stays as typed. A tag without
   * a region keeps the point, because US Spanish content declares `es`, which CLDR gives a decimal
   * comma. The option reads text written in the language's convention, so a second pass over its
   * output would read a list comma as a decimal.
   */
  latexNumbers?: boolean;
}

// U+061C ALM, LRM, RLM, the embeddings and overrides U+202A–U+202E, the
// isolates U+2066–U+2069, and tatweel U+0640, which only stretches a join.
const BIDI_CONTROLS_AND_TATWEEL = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069\u0640]/g;

// Arabic Presentation Forms-A and -B. Their compatibility decompositions are
// the base letters, so NFKC folds them without touching anything else.
const PRESENTATION_FORMS = /[\uFB50-\uFDFF\uFE70-\uFEFC]+/g;

const DECIMAL_DIGIT = /\p{Nd}/u;
const NON_ASCII_DIGITS = /(?![0-9])\p{Nd}/gu;
const ARABIC_DECIMAL_SEPARATOR = /\u066B/g;
const ARABIC_THOUSANDS_SEPARATOR = /\u066C/g;
// A number with marks between its digits, and a comma that ends one before a repeating `\overline`.
const NUMBER_RUN = /[0-9]+(?:(?:[.,]|\{,\})[0-9]+)*(?:(?:,|\{,\})(?=\\overline))?/g;
const NUMBER_MARK = /[.,]|\{,\}/g;
// `\;` is a TeX space and `&aacute;`, `&#233;` and `&#xE9;` HTML entities, not list separators.
// A matrix column `&` before a digit starts no entity.
const LIST_SEMICOLON = /(?<!\\|&(?:[a-zA-Z][a-zA-Z0-9]*|#[0-9]+|#[xX][0-9a-fA-F]+));/g;

/** A number's one decimal comma as a point. A number with two marks, `1.000,5` or `1,2,3`, has no one reading. */
const readDecimalComma = (run: string): string => {
  const marks = run.match(NUMBER_MARK) ?? [];
  return marks.length === 1 && marks[0] !== '.' ? run.replace(NUMBER_MARK, '.') : run;
};

// CLDR 48 (ICU 78), Latin digits: the two-letter languages whose numbers take a decimal comma,
// and per language the regions that write the other mark. A fixed table, so that every runtime
// scores alike: Safari and Node disagree on `fr-CH`, and ICU versions on `en-ZA`.
const DECIMAL_COMMA_LANGUAGES = new Set(
  (
    'af az be bg br bs ca cs cv da de el eo es et eu ff fi fo fr fy gl hr hu hy ia id ie is it jv ' +
    'ka kk kl ku ky lb ln lo lt lu lv mk nb nl nn no oc os pl ps pt rm rn ro ru rw sc se sg sk sl ' +
    'sq sr su sv tg tk tr tt uk uz vi wo'
  ).split(' ')
);
const OTHER_MARK_REGIONS: Record<string, readonly string[]> = {
  ar: ['DZ', 'LB', 'LY', 'MA', 'MR', 'TN'],
  de: ['CH', 'LI'],
  en: 'AT BE CZ DE DK EE ES FI FR GE HU ID IT LT LV NL NO PL PT RO SE SI SK UA ZA'.split(' '),
  es: '419 BR BZ CU DO GT HN MX NI PA PE PR SV US'.split(' '),
  it: ['CH'],
  kk: ['CN'],
  ku: ['IQ'],
  ms: ['BN', 'ID'],
  qu: ['BO'],
  sw: ['CD'],
};

const ALEF_FORMS = /[\u0622\u0623\u0625\u0671]/g;
// Fathatan to sukun, the extended marks up to U+065F, and superscript alef.
const TASHKEEL = /[\u064B-\u065F\u0670]/g;

const digitValues = new Map<number, number>();

/**
 * Unicode assigns decimal digits only in contiguous runs of ten, ascending
 * from zero, so a digit's value is its offset into its run modulo ten. Runs
 * can abut (the mathematical digits are five in a row), hence the modulo.
 */
const digitValue = (codePoint: number): number => {
  const cached = digitValues.get(codePoint);
  if (cached !== undefined) return cached;
  let offset = 0;
  while (DECIMAL_DIGIT.test(String.fromCodePoint(codePoint - offset - 1))) offset++;
  const value = offset % 10;
  digitValues.set(codePoint, value);
  return value;
};

/** Every Unicode decimal digit (`\p{Nd}`) replaced by its ASCII digit. */
export const foldDigits = (value: string): string =>
  value.replace(NON_ASCII_DIGITS, (digit) => String(digitValue(digit.codePointAt(0) as number)));

interface NumberMarks {
  decimal: string;
  group: string;
}

const POINT_DECIMAL: NumberMarks = { decimal: '.', group: ',' };
const numberMarks = new Map<string, NumberMarks>();

/**
 * The marks the language writes Western digits with: `,` decimal in `de`, `.` in `en`.
 * A tag the runtime has no data for keeps the point-decimal marks, because
 * `Intl` would otherwise format in the host's default locale.
 */
const marksFor = (language: string | undefined): NumberMarks => {
  if (!language) return POINT_DECIMAL;
  const cached = numberMarks.get(language);
  if (cached) return cached;
  let marks = POINT_DECIMAL;
  try {
    if (Intl.NumberFormat.supportedLocalesOf(language).length > 0) {
      const parts = new Intl.NumberFormat(language, { numberingSystem: 'latn' }).formatToParts(
        12345.6
      );
      marks = {
        decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
        group: parts.find((part) => part.type === 'group')?.value ?? ',',
      };
    }
  } catch {
    // An invalid tag keeps the point-decimal marks.
  }
  numberMarks.set(language, marks);
  return marks;
};

/**
 * Whether the tag names a region and that region writes a decimal comma. `es` has
 * no region, so it keeps the point that US Spanish content is written with.
 */
const writesDecimalComma = (language: string | undefined): boolean => {
  if (!language) return false;
  try {
    const { language: primary, region } = new Intl.Locale(language);
    if (!region) return false;
    return (
      DECIMAL_COMMA_LANGUAGES.has(primary) !==
      (OTHER_MARK_REGIONS[primary]?.includes(region) ?? false)
    );
  } catch {
    // An invalid tag keeps the point.
    return false;
  }
};

// The codes BCP 47 reserves for no particular language: undetermined, no linguistic
// content, multiple languages and uncoded.
const NO_LANGUAGE = new Set(['und', 'zxx', 'mul', 'mis']);

/** The canonical BCP 47 tag for a language code, or `undefined` when it names no language. */
const languageTag = (code: string): string | undefined => {
  const tag = canonicalLanguageTag(code);
  return tag && !NO_LANGUAGE.has(tag.split('-')[0]) ? tag : undefined;
};

/** The first of `model.language` and `env.locale` that `read` finds a language in. */
const firstLanguage = (
  model: object | null | undefined,
  env: object | null | undefined,
  read: (code: string) => string | undefined
): string | undefined => {
  // Typed as `object` so that any element's model and environment type is
  // accepted, whatever else it declares.
  const tags = [
    (model as { language?: unknown } | null)?.language,
    (env as { locale?: unknown } | null)?.locale,
  ];
  for (const tag of tags) {
    const language = typeof tag === 'string' ? read(tag) : undefined;
    if (language) return language;
  }
  return undefined;
};

/**
 * The language a comparison runs in: the element's `model.language`, then the
 * item's `env.locale`. A value that names no language passes to the next.
 */
export const contentLanguage = (model?: object | null, env?: object | null): string | undefined =>
  firstLanguage(model, env, languageTag);

/**
 * The language math scoring reads numbers in, to pass with `latexNumbers`: as `contentLanguage`
 * finds it, except that an underscore code (`es_ES`, `tr_TR`) yields its language alone. Its
 * producers, the authoring dropdown and the Learnosity transform, write `es_ES` for Spanish of any
 * region, and content tagged `es_ES` mostly uses US number conventions, so a decimal comma comes
 * only from a hyphenated tag.
 */
export const mathContentLanguage = (
  model?: object | null,
  env?: object | null
): string | undefined =>
  firstLanguage(model, env, (code) =>
    languageTag(code.includes('_') ? code.slice(0, code.indexOf('_')) : code)
  );

// The languages whose dotted and dotless i fold apart. Lithuanian's
// special casing keeps the dot on accented i, so `Ì` would no longer fold to
// `ì`; it and every other language fold with `toLowerCase()`.
const TURKIC = /^(tr|az)(-|$)/i;

/**
 * Lower case for comparison: `toLocaleLowerCase` in Turkish and Azerbaijani,
 * so dotted and dotless i fold correctly, and `toLowerCase()` otherwise.
 */
export const foldCase = (value: string, language?: string): string => {
  if (!language || !TURKIC.test(language)) return value.toLowerCase();
  try {
    return value.toLocaleLowerCase(language);
  } catch {
    return value.toLowerCase();
  }
};

/**
 * The comparable form of a typed response or authored answer: case folded
 * when the options ask for it; bidi controls and tatweel removed; Arabic
 * presentation forms folded to base letters; NFC; every decimal digit folded
 * to 0–9; `٫` and `٬` replaced by the content language's decimal and group
 * marks, or with `latexNumbers` by the marks math-validation computes on. Arabic letter variants, accents, whitespace runs and the spacing
 * around `/` fold only when the options ask for it.
 */
export const normalizeResponse = (value: string, options: NormalizeOptions = {}): string => {
  const marks = options.latexNumbers ? POINT_DECIMAL : marksFor(options.language);
  // Case folds first, on the text as typed: lower-casing can leave combining
  // marks out of canonical order, and a separator folded to `.` changes where
  // a Greek sigma counts as final, so folding later could part two strings
  // that `toLowerCase()` treats as equal. NFC follows the removals, because
  // removing a control or tatweel can bring a letter and its combining mark
  // together.
  let result = (options.ignoreCase ? foldCase(value, options.language) : value)
    .replace(BIDI_CONTROLS_AND_TATWEEL, '')
    .replace(PRESENTATION_FORMS, (forms) => forms.normalize('NFKC'))
    .normalize('NFC');
  result = foldDigits(result);
  // Before the Arabic marks fold, so that a `٬` group mark does not become a comma read as a decimal.
  if (options.latexNumbers && writesDecimalComma(options.language)) {
    result = result.replace(NUMBER_RUN, readDecimalComma).replace(LIST_SEMICOLON, ', ');
  }
  result = result
    .replace(ARABIC_DECIMAL_SEPARATOR, marks.decimal)
    .replace(ARABIC_THOUSANDS_SEPARATOR, marks.group);
  if (options.foldLetterVariants) {
    result = result
      .replace(TASHKEEL, '')
      .replace(ALEF_FORMS, '\u0627')
      .replace(/\u0629/g, '\u0647')
      .replace(/\u0649/g, '\u064A');
  }
  if (options.ignoreAccents) {
    result = result
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '')
      .normalize('NFC');
  }
  if (options.collapseWhitespace) {
    result = result.replace(/\s+/g, ' ').trim();
  }
  if (options.ignoreSlashSpacing) {
    result = result.replace(/\s*\/\s*/g, '/');
  }
  return result;
};
