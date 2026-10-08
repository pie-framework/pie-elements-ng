/**
 * Markers for the colors an author wrote into model HTML, so a color scheme can override them.
 *
 * An inline `color` or `background-color` outranks the stylesheet that applies a color scheme,
 * so authored ink and fills stay as written and can fall below WCAG contrast on a dark scheme.
 * `sanitizeModelHtml` marks every element that carries one, and pie-players' scheme CSS
 * overrides marked elements under `[data-color-scheme]`: ink takes the scheme's text color,
 * borders its border color, and a fill follows `AUTHORED_FILL_ATTR`. (PIE-1119)
 */

/** On an element with an authored text color: inline `color` or `<font color>`. */
export const AUTHORED_INK_ATTR = 'data-pie-authored-ink';
/** On an element with an authored fill: inline `background-color` or `bgcolor`. */
export const AUTHORED_FILL_ATTR = 'data-pie-authored-fill';
/** On an element with an authored border color on any side. */
export const AUTHORED_BORDER_ATTR = 'data-pie-authored-border';

/**
 * `light` is a near-white fill, usually the background of a page the text was pasted from, which
 * a scheme drops. `shade` is any other fill, which marks a header, a highlight or a figure's
 * shading, and which a scheme inverts so it keeps standing out.
 */
export type AuthoredFill = 'light' | 'shade';

const BORDER_COLORS = [
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
];

// Values that already follow the cascade or a theme token, so a scheme reaches them unmarked.
const NOT_AUTHORED = new Set([
  'currentcolor',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'transparent',
]);

/** Channels from 0 to 255, unrounded, and alpha from 0 to 1. */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Whether `value` is a color the author chose, as opposed to a keyword, a token or no paint. */
export function isAuthoredColor(value: string | null | undefined): boolean {
  const v = value?.trim().toLowerCase();
  if (!v || NOT_AUTHORED.has(v) || v.includes('var(')) return false;
  return parseCssColor(v)?.a !== 0;
}

/**
 * Classifies a fill composited over white. Light means relative luminance of at least 0.85 and
 * chroma of at most 0.08, so `#eee` is light and `#ddd`, `lightgrey` and every hue are shade.
 * A color this parser cannot read, such as `color-mix()`, counts as shade.
 */
export function classifyAuthoredFill(value: string): AuthoredFill {
  const c = parseCssColor(value);
  if (!c) return 'shade';
  const over = (v: number) => (v * c.a + 255 * (1 - c.a)) / 255;
  const [r, g, b] = [over(c.r), over(c.g), over(c.b)];
  const lum = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return lum >= 0.85 && chroma <= 0.08 ? 'light' : 'shade';
}

/**
 * Sets the authored-color markers on `el` from its inline style and presentational attributes,
 * replacing any markers already there, and drops `!important` from each marked declaration,
 * because an inline `!important` beats the scheme stylesheet's.
 */
export function markAuthoredColors(el: Element): void {
  el.removeAttribute(AUTHORED_INK_ATTR);
  el.removeAttribute(AUTHORED_FILL_ATTR);
  el.removeAttribute(AUTHORED_BORDER_ATTR);

  const style = el.hasAttribute('style') ? (el as HTMLElement).style : undefined;
  // Not every DOM gives MathML elements a `style`.
  const declared = (prop: string) => style?.getPropertyValue(prop).trim() ?? '';
  const marked: string[] = [];

  // A declaration in the style attribute outranks the presentational attribute it shadows.
  const ink = declared('color');
  const fontInk = el.localName === 'font' ? el.getAttribute('color') : null;
  if (isAuthoredColor(ink || fontInk)) {
    el.setAttribute(AUTHORED_INK_ATTR, '');
    if (ink) marked.push('color');
  }

  const declaredFill = declared('background-color');
  const fill = declaredFill || legacyColor(el.getAttribute('bgcolor'));
  if (isAuthoredColor(fill)) {
    el.setAttribute(AUTHORED_FILL_ATTR, classifyAuthoredFill(fill));
    if (declaredFill) marked.push('background-color');
  }

  const borders = BORDER_COLORS.filter((prop) => isAuthoredColor(declared(prop)));
  if (borders.length) {
    el.setAttribute(AUTHORED_BORDER_ATTR, '');
    marked.push(...borders);
  }

  // Rewriting a declaration re-serializes the whole style attribute, so only when it must.
  for (const prop of marked) {
    if (style?.getPropertyPriority(prop) === 'important') {
      style.setProperty(prop, style.getPropertyValue(prop));
    }
  }
}

// `bgcolor="ddd"` paints #ddd: the legacy attribute parser reads hex without the hash.
function legacyColor(value: string | null): string {
  const v = value?.trim() ?? '';
  return /^(?:[\da-f]{3}|[\da-f]{6})$/i.test(v) ? `#${v}` : v;
}

/**
 * Parses a CSS color into sRGB: hex, named colors and `rgb()`, `hsl()`, `hwb()`, `lab()`,
 * `lch()`, `oklab()` and `oklch()` in legacy and modern syntax, clipped to the sRGB gamut.
 * Returns null for anything else, including `var()`, `calc()`, `color()` and system colors.
 */
export function parseCssColor(value: string): Rgba | null {
  const v = value.trim().toLowerCase();
  if (v === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const named = namedColors().get(v);
  if (named) return parseHex(named);
  if (v.startsWith('#')) return parseHex(v.slice(1));

  const fn = /^([a-z]+)\(([^()]*)\)$/.exec(v);
  if (!fn) return null;
  const args = fn[2].trim().split(/\s*[\s,/]\s*/);
  if (args.length !== 3 && args.length !== 4) return null;
  const [p, q, s, alphaArg] = args;
  const a = alpha(alphaArg);

  let rgb: number[];
  switch (fn[1]) {
    case 'rgb':
    case 'rgba':
      rgb = [p, q, s].map((t) => component(t, 255) / 255);
      break;
    case 'hsl':
    case 'hsla':
      rgb = hslToRgb(hue(p), component(q, 100) / 100, component(s, 100) / 100);
      break;
    case 'hwb':
      rgb = hwbToRgb(hue(p), component(q, 100) / 100, component(s, 100) / 100);
      break;
    case 'lab':
      rgb = labToRgb(component(p, 100), component(q, 125), component(s, 125));
      break;
    case 'lch':
      rgb = labToRgb(component(p, 100), ...polar(component(q, 150), hue(s)));
      break;
    case 'oklab':
      rgb = oklabToRgb(component(p, 1), component(q, 0.4), component(s, 0.4));
      break;
    case 'oklch':
      rgb = oklabToRgb(component(p, 1), ...polar(component(q, 0.4), hue(s)));
      break;
    default:
      return null;
  }
  if (Number.isNaN(a) || rgb.some(Number.isNaN)) return null;
  const [r, g, b] = rgb.map((c) => clamp(c, 0, 1) * 255);
  return { r, g, b, a };
}

let NAMED: Map<string, string> | undefined;

// CSS Color 4's named colors as name:hex, in one string to keep the bundle small.
function namedColors(): Map<string, string> {
  NAMED ??= new Map(
    (
      'aliceblue:f0f8ff antiquewhite:faebd7 aqua:00ffff aquamarine:7fffd4 azure:f0ffff beige:f5f5dc ' +
      'bisque:ffe4c4 black:000000 blanchedalmond:ffebcd blue:0000ff blueviolet:8a2be2 brown:a52a2a ' +
      'burlywood:deb887 cadetblue:5f9ea0 chartreuse:7fff00 chocolate:d2691e coral:ff7f50 ' +
      'cornflowerblue:6495ed cornsilk:fff8dc crimson:dc143c cyan:00ffff darkblue:00008b ' +
      'darkcyan:008b8b darkgoldenrod:b8860b darkgray:a9a9a9 darkgreen:006400 darkgrey:a9a9a9 ' +
      'darkkhaki:bdb76b darkmagenta:8b008b darkolivegreen:556b2f darkorange:ff8c00 ' +
      'darkorchid:9932cc darkred:8b0000 darksalmon:e9967a darkseagreen:8fbc8f darkslateblue:483d8b ' +
      'darkslategray:2f4f4f darkslategrey:2f4f4f darkturquoise:00ced1 darkviolet:9400d3 ' +
      'deeppink:ff1493 deepskyblue:00bfff dimgray:696969 dimgrey:696969 dodgerblue:1e90ff ' +
      'firebrick:b22222 floralwhite:fffaf0 forestgreen:228b22 fuchsia:ff00ff gainsboro:dcdcdc ' +
      'ghostwhite:f8f8ff gold:ffd700 goldenrod:daa520 gray:808080 green:008000 greenyellow:adff2f ' +
      'grey:808080 honeydew:f0fff0 hotpink:ff69b4 indianred:cd5c5c indigo:4b0082 ivory:fffff0 ' +
      'khaki:f0e68c lavender:e6e6fa lavenderblush:fff0f5 lawngreen:7cfc00 lemonchiffon:fffacd ' +
      'lightblue:add8e6 lightcoral:f08080 lightcyan:e0ffff lightgoldenrodyellow:fafad2 ' +
      'lightgray:d3d3d3 lightgreen:90ee90 lightgrey:d3d3d3 lightpink:ffb6c1 lightsalmon:ffa07a ' +
      'lightseagreen:20b2aa lightskyblue:87cefa lightslategray:778899 lightslategrey:778899 ' +
      'lightsteelblue:b0c4de lightyellow:ffffe0 lime:00ff00 limegreen:32cd32 linen:faf0e6 ' +
      'magenta:ff00ff maroon:800000 mediumaquamarine:66cdaa mediumblue:0000cd mediumorchid:ba55d3 ' +
      'mediumpurple:9370db mediumseagreen:3cb371 mediumslateblue:7b68ee mediumspringgreen:00fa9a ' +
      'mediumturquoise:48d1cc mediumvioletred:c71585 midnightblue:191970 mintcream:f5fffa ' +
      'mistyrose:ffe4e1 moccasin:ffe4b5 navajowhite:ffdead navy:000080 oldlace:fdf5e6 olive:808000 ' +
      'olivedrab:6b8e23 orange:ffa500 orangered:ff4500 orchid:da70d6 palegoldenrod:eee8aa ' +
      'palegreen:98fb98 paleturquoise:afeeee palevioletred:db7093 papayawhip:ffefd5 ' +
      'peachpuff:ffdab9 peru:cd853f pink:ffc0cb plum:dda0dd powderblue:b0e0e6 purple:800080 ' +
      'rebeccapurple:663399 red:ff0000 rosybrown:bc8f8f royalblue:4169e1 saddlebrown:8b4513 ' +
      'salmon:fa8072 sandybrown:f4a460 seagreen:2e8b57 seashell:fff5ee sienna:a0522d silver:c0c0c0 ' +
      'skyblue:87ceeb slateblue:6a5acd slategray:708090 slategrey:708090 snow:fffafa ' +
      'springgreen:00ff7f steelblue:4682b4 tan:d2b48c teal:008080 thistle:d8bfd8 tomato:ff6347 ' +
      'turquoise:40e0d0 violet:ee82ee wheat:f5deb3 white:ffffff whitesmoke:f5f5f5 yellow:ffff00 ' +
      'yellowgreen:9acd32'
    )
      .split(' ')
      .map((entry) => entry.split(':') as [string, string])
  );
  return NAMED;
}

function parseHex(hex: string): Rgba | null {
  if (!/^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.test(hex)) return null;
  const digits = hex.length <= 4 ? [...hex].map((d) => d + d) : (hex.match(/../g) ?? []);
  const [r, g, b, a = 255] = digits.map((d) => Number.parseInt(d, 16));
  return { r, g, b, a: a / 255 };
}

const NUMBER = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn)?$/;

// A number, or a percentage of `percentOf`; `none` is zero.
function component(token: string, percentOf: number): number {
  if (token === 'none') return 0;
  const m = NUMBER.exec(token);
  if (!m || (m[2] && m[2] !== '%')) return Number.NaN;
  return m[2] ? (Number(m[1]) / 100) * percentOf : Number(m[1]);
}

function hue(token: string): number {
  if (token === 'none') return 0;
  const m = NUMBER.exec(token);
  if (!m || m[2] === '%') return Number.NaN;
  const n = Number(m[1]);
  const deg =
    m[2] === 'rad'
      ? (n * 180) / Math.PI
      : m[2] === 'grad'
        ? n * 0.9
        : m[2] === 'turn'
          ? n * 360
          : n;
  return ((deg % 360) + 360) % 360;
}

function alpha(token: string | undefined): number {
  if (token === undefined) return 1;
  return clamp(component(token, 1), 0, 1);
}

function polar(chroma: number, h: number): [number, number] {
  const c = Math.max(0, chroma);
  const rad = (h * Math.PI) / 180;
  return [c * Math.cos(rad), c * Math.sin(rad)];
}

function hslToRgb(h: number, s: number, l: number): number[] {
  const sat = clamp(s, 0, 1);
  const light = clamp(l, 0, 1);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const amp = sat * Math.min(light, 1 - light);
    return light - amp * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function hwbToRgb(h: number, w: number, b: number): number[] {
  const white = clamp(w, 0, 1);
  const black = clamp(b, 0, 1);
  if (white + black >= 1) return Array(3).fill(white / (white + black));
  return hslToRgb(h, 1, 0.5).map((c) => c * (1 - white - black) + white);
}

// CSS Color 4, section 18: Lab (D50) to XYZ, Bradford-adapted to D65, to linear sRGB.
const KAPPA = 24389 / 27;
const EPSILON = 216 / 24389;
const D50 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585];
const D50_TO_D65 = [
  [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
  [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
  [0.012314014864481998, -0.020507649298898964, 1.330365926242124],
];
const XYZ_TO_LINEAR_SRGB = [
  [12831 / 3959, -329 / 214, -1974 / 3959],
  [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
  [705 / 12673, -2585 / 12673, 705 / 667],
];

function labToRgb(lightness: number, a: number, b: number): number[] {
  const l = clamp(lightness, 0, 100);
  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const xyz = [
    fx ** 3 > EPSILON ? fx ** 3 : (116 * fx - 16) / KAPPA,
    l > KAPPA * EPSILON ? fy ** 3 : l / KAPPA,
    fz ** 3 > EPSILON ? fz ** 3 : (116 * fz - 16) / KAPPA,
  ].map((c, i) => c * D50[i]);
  return multiply(XYZ_TO_LINEAR_SRGB, multiply(D50_TO_D65, xyz)).map(gamma);
}

function oklabToRgb(lightness: number, a: number, b: number): number[] {
  const l = clamp(lightness, 0, 1);
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((c) => c ** 3);
  return multiply(
    [
      [4.0767416621, -3.3077115913, 0.2309699292],
      [-1.2684380046, 2.6097574011, -0.3413193965],
      [-0.0041960863, -0.7034186147, 1.707614701],
    ],
    lms
  ).map(gamma);
}

function multiply(m: number[][], v: number[]): number[] {
  return m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
}

function gamma(c: number): number {
  const v = clamp(c, 0, 1);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

function linear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
