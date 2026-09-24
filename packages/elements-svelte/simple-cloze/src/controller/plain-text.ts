/**
 * The text an HTML fragment reads as, computed without a DOM because
 * controllers also run server-side. An answer key authored in an editor is HTML
 * (`<p>Salt &amp; pepper</p>`) while the learner types plain text.
 */

// HTML 4's Latin-1 entities name U+00A0 to U+00FF in code point order.
const LATIN_1 = [
  'nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr',
  'deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest',
  'Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml',
  'ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig',
  'agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml',
  'eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml',
].join(' ');

// Small Greek letters from U+03B1. Each capital sits 32 below its small letter;
// final sigma has none, and U+03A2 is unassigned.
const GREEK =
  'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho ' +
  'sigmaf sigma tau upsilon phi chi psi omega';

const SYMBOLS: Record<string, number> = {
  quot: 0x22,
  amp: 0x26,
  apos: 0x27,
  lt: 0x3c,
  gt: 0x3e,
  ensp: 0x2002,
  emsp: 0x2003,
  thinsp: 0x2009,
  ndash: 0x2013,
  mdash: 0x2014,
  lsquo: 0x2018,
  rsquo: 0x2019,
  sbquo: 0x201a,
  ldquo: 0x201c,
  rdquo: 0x201d,
  bdquo: 0x201e,
  bull: 0x2022,
  hellip: 0x2026,
  prime: 0x2032,
  Prime: 0x2033,
  euro: 0x20ac,
  trade: 0x2122,
  minus: 0x2212,
  radic: 0x221a,
  infin: 0x221e,
  asymp: 0x2248,
  ne: 0x2260,
  le: 0x2264,
  ge: 0x2265,
};

const NAMED = new Map<string, number>(Object.entries(SYMBOLS));
for (const [i, name] of LATIN_1.split(' ').entries()) {
  NAMED.set(name, 0xa0 + i);
}
for (const [i, name] of GREEK.split(' ').entries()) {
  NAMED.set(name, 0x3b1 + i);
  if (name !== 'sigmaf') NAMED.set(name[0].toUpperCase() + name.slice(1), 0x391 + i);
}

// As the HTML tokenizer reads markup: `<` opens a tag only before a letter or
// `/`, so `3 < 5` stays text. Line breaks and block boundaries separate words;
// inline tags do not (`<b>Par</b>is`).
const BLOCK_BOUNDARY = /<\/?(?:br|p|div|li|h[1-6]|blockquote|pre|tr|td|th)\b[^>]*>/gi;
const TAG = /<\/?[a-z][^>]*>|<!--[\s\S]*?-->/gi;
const ENTITY = /&(#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi;

const decodeEntity = (match: string, body: string): string => {
  if (body[0] === '#') {
    const hex = body[1] === 'x' || body[1] === 'X';
    const code = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
    // HTML decodes NUL, a surrogate or an out-of-range number to U+FFFD.
    const valid = code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff);
    return String.fromCodePoint(valid ? code : 0xfffd);
  }
  const code = NAMED.get(body);
  return code === undefined ? match : String.fromCodePoint(code);
};

/**
 * Tags stripped, entities decoded (named and numeric), and each run of
 * whitespace, `&nbsp;` included, collapsed to one space and trimmed. An unknown
 * named entity stays as written.
 */
export const toPlainText = (value: unknown): string =>
  typeof value === 'string'
    ? value
        .replace(BLOCK_BOUNDARY, ' ')
        .replace(TAG, '')
        .replace(ENTITY, decodeEntity)
        .replace(/\s+/g, ' ')
        .trim()
    : '';
