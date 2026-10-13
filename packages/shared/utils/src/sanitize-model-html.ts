/**
 * Sanitizer for the rich-text fields of an element model: prompts, choice labels, feedback,
 * rationale, teacher instructions and the markup cloze elements build blanks from.
 *
 * Players pass models to elements verbatim and sanitize only the item's own markup, so every
 * element sink that writes model HTML into the DOM runs it through `sanitizeModelHtml` first.
 *
 * The forbid-lists are pie-players' `sanitize-forbidden-lists.ts` without `<iframe>` and
 * `<object>`: production prompts embed videos and simulations in `<iframe>` and item-bank SVG
 * images in `<object>`. DOMPurify's URI check confines both to http(s) and relative URLs, and
 * `srcdoc`, `classid` and `codebase` are not allowed attributes.
 * https://github.com/pie-framework/pie-players/blob/develop/packages/players-shared/src/security/sanitize-forbidden-lists.ts
 */

import DOMPurify, { type Config } from 'dompurify';
import { markAuthoredColors } from './authored-colors.js';

export const MODEL_HTML_FORBIDDEN_TAGS = [
  'script',
  'embed',
  'base',
  'form',
  'meta',
  'link',
  // Elements render in light DOM, so a <style> restyles the host page outside the element.
  'style',
  'foreignobject',
];

// DOMPurify drops every `on*` attribute on its own; the list keeps them dropped if its
// defaults change.
export const MODEL_HTML_FORBIDDEN_ATTRS = [
  'onerror',
  'onload',
  'onclick',
  'onmouseover',
  'onmouseout',
  'onmouseenter',
  'onmouseleave',
  'onfocus',
  'onblur',
  'onkeydown',
  'onkeyup',
  'onkeypress',
  'onsubmit',
  'onchange',
  'onbeforeunload',
  'formaction',
  'xlink:href',
];

// Tags authored content uses beyond DOMPurify's defaults. The rest are MathML that DOMPurify
// drops: elementary math, which `@pie-element/shared-math-rendering-mathjax` rewrites as a table
// before MathJax reads it, and `semantics`, `annotation` and `none`.
// `annotation-xml` stays out because it is an HTML integration point. pie-players' item markup
// sanitizer keeps the same MathML.
const EXTRA_TAGS = new Set([
  'iframe',
  'object',
  'mstack',
  'mlongdiv',
  'msgroup',
  'msrow',
  'msline',
  'mscarries',
  'mscarry',
  'semantics',
  'annotation',
  'none',
]);

// Prefixed MathML such as `<m:math>`, which the HTML parser reads as unknown HTML elements and
// `@pie-element/shared-math-rendering-mathjax` re-creates as MathML.
const PREFIXED_TAG = /^[a-z_][\w.-]*:[a-z][\w.-]*$/;

const EXTRA_ATTRS = [
  // <img alignment>, written by the image editors and read by PreviewPrompt.
  'alignment',
  'target',
  'allow',
  'allowfullscreen',
  'frameborder',
  'scrolling',
  // <object data>, validated as a URI.
  'data',
  // Elementary math and `<mspace linebreak>`.
  'stackalign',
  'charalign',
  'charspacing',
  'longdivstyle',
  'position',
  'shift',
  'location',
  'crossout',
  'leftoverhang',
  'rightoverhang',
  'mslinethickness',
  'linebreak',
];

// The one inline handler authored content relies on: Star's listening prompts play an `<audio>`
// that has no controls from an image link. Such a link keeps the audio's id in `PLAY_AUDIO_ATTR`
// instead, and one document listener plays it, so the prompt still plays and no authored script
// runs.
const PLAY_AUDIO_HANDLER =
  /^\s*document\.getElementById\((['"])([^'"]+)\1\)\.play\(\)\s*;?\s*(?:return\s+false\s*;?\s*)?$/;
export const PLAY_AUDIO_ATTR = 'data-pie-play-audio';

const CONFIG: Config = {
  ADD_TAGS: (tagName: string) => EXTRA_TAGS.has(tagName) || PREFIXED_TAG.test(tagName),
  ADD_ATTR: EXTRA_ATTRS,
  FORBID_TAGS: MODEL_HTML_FORBIDDEN_TAGS,
  FORBID_ATTR: MODEL_HTML_FORBIDDEN_ATTRS,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  RETURN_TRUSTED_TYPE: false,
};

let playListenerInstalled = false;

function playAudioFromLink(event: MouseEvent) {
  for (const target of event.composedPath()) {
    if (!(target instanceof Element)) continue;
    const id = target.getAttribute(PLAY_AUDIO_ATTR);
    if (id === null) continue;
    event.preventDefault();
    const root = target.getRootNode() as Document | ShadowRoot;
    const audio = root.getElementById?.(id) ?? document.getElementById(id);
    if (audio instanceof HTMLMediaElement) void audio.play()?.catch(() => undefined);
    return;
  }
}

let purifier: typeof DOMPurify | null = null;

// A purifier of its own, so the hooks stay off the default instance other code shares.
function getPurifier(): typeof DOMPurify {
  if (purifier) return purifier;
  purifier = DOMPurify(window);
  purifier.addHook('beforeSanitizeAttributes', (node) => {
    if (node.nodeName !== 'A') return;
    const id = PLAY_AUDIO_HANDLER.exec(node.getAttribute('onclick') ?? '')?.[2];
    if (id === undefined) return;
    node.removeAttribute('onclick');
    node.setAttribute(PLAY_AUDIO_ATTR, id);
    if (!playListenerInstalled) {
      document.addEventListener('click', playAudioFromLink);
      playListenerInstalled = true;
    }
  });
  purifier.addHook('afterSanitizeAttributes', markAuthoredColors);
  return purifier;
}

// Components re-render the same fields many times, so results are cached per input. The budget
// is in characters, inputs and outputs together, because a passage or a select-text body is
// orders of magnitude longer than a choice label.
const CACHE_BUDGET = 1_000_000;
const cache = new Map<string, string>();
let cachedChars = 0;

/**
 * Returns `html` with scripts, event handlers, `javascript:` URLs and the forbidden tags and
 * attributes removed. A link that only plays an `<audio>` keeps working; see `PLAY_AUDIO_ATTR`.
 * Elements with an authored color carry the markers a color scheme overrides them by; see
 * `markAuthoredColors`.
 * Returns an empty string where there is no DOM to sanitize against.
 *
 * Takes any value because model fields are not always strings: a number renders as its text,
 * as it did when passed to `innerHTML` directly.
 */
export function sanitizeModelHtml(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (!DOMPurify.isSupported) return '';
  const html = typeof value === 'string' ? value : String(value);

  const hit = cache.get(html);
  if (hit !== undefined) return hit;

  const sanitized = String(getPurifier().sanitize(html, CONFIG));
  const size = html.length + sanitized.length;
  if (size > CACHE_BUDGET) return sanitized;

  for (const [key, entry] of cache) {
    if (cachedChars + size <= CACHE_BUDGET) break;
    cache.delete(key);
    cachedChars -= key.length + entry.length;
  }
  cache.set(html, sanitized);
  cachedChars += size;
  return sanitized;
}
