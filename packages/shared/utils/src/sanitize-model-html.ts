/**
 * Sanitizer for the rich-text fields of an element model: prompts, choice labels, feedback,
 * rationale, teacher instructions and the markup cloze elements build blanks from.
 *
 * Players pass models to elements verbatim and sanitize only the item's own markup, so every
 * element sink that writes model HTML into the DOM runs it through `sanitizeModelHtml` first.
 *
 * The forbid-lists are pie-players' `sanitize-forbidden-lists.ts` without `<iframe>`: production
 * prompts embed videos, audio and simulations in frames, so an `<iframe>` whose `src` is one of
 * `FRAME_SOURCES` stays and any other is removed. `srcdoc` is not an allowed attribute. An
 * `<object>` holding an image becomes an `<img>`; any other `<object>` is removed.
 * https://github.com/pie-framework/pie-players/blob/develop/packages/players-shared/src/security/sanitize-forbidden-lists.ts
 */

import DOMPurify, { type Config } from 'dompurify';
import { markAuthoredColors } from './authored-colors.js';
import { AUTOPLAY_AUDIO_MARKUP_ATTRS } from './prompt-audio.js';

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

// The embed endpoints a frame may load: an https origin and a path matched on segment boundaries,
// which keeps a provider's redirect and page paths out. They are the endpoints production item and
// passage prompts embed (November 2026). A frame from anywhere else is a document its author
// controls inside the item, free to imitate the host or request the permissions `allow` delegates.
const FRAME_SOURCES = [
  'https://www.youtube.com/embed',
  'https://youtube.com/embed',
  'https://www.youtube-nocookie.com/embed',
  'https://player.vimeo.com/video',
  'https://w.soundcloud.com/player',
  'https://content.jwplatform.com/players',
  'https://cdnapisec.kaltura.com/p',
  'https://embed.ted.com/talks',
  'https://www.khanacademy.org/embed_video',
  'https://www.history.com/embed',
  'https://edpuzzle.com/embed',
  'https://giphy.com/embed',
  'https://vocaroo.com/embed',
  'https://drive.google.com/file',
  'https://docs.google.com/document',
  'https://www.google.com/maps/embed',
  'https://phet.colorado.edu/sims',
  'https://www.desmos.com/calculator',
  'https://sampleitems.smarterbalanced.org/item',
].map((source) => new URL(source));

// Resolves a relative `src` to an origin no source has, and a protocol-relative one to https.
const FRAME_BASE = 'https://invalid.invalid/';

function allowedFrameSrc(src: string | null): string | null {
  if (!src) return null;
  let url: URL;
  try {
    url = new URL(src, FRAME_BASE);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  const allowed = FRAME_SOURCES.some(
    (source) =>
      url.origin === source.origin &&
      (url.pathname === source.pathname || url.pathname.startsWith(`${source.pathname}/`))
  );
  return allowed ? url.href : null;
}

function keepAllowedFrame(node: Element) {
  if (node.nodeName !== 'IFRAME') return;
  const src = allowedFrameSrc(node.getAttribute('src'));
  if (src === null) {
    node.remove();
    return;
  }
  node.setAttribute('src', src);
  // A link whose `target` names the frame would navigate it anywhere.
  node.removeAttribute('name');
}

// Production prompts use `<object>` only for item-bank SVG images, mostly written self-closing.
// HTML ignores the slash, so the object holds the rest of the prompt as fallback content, hidden
// once the image loads. The image becomes an `<img>` followed by that content, both sanitized
// after it. DOMPurify removes the emptied object, and keeps the content of any other.
const IMAGE_TYPE = /^\s*image\b/i;
const IMAGE_OBJECT_ATTRS = ['alt', 'width', 'height', 'title', 'class', 'style'];

function objectToImage(node: Node) {
  if (node.nodeName !== 'OBJECT') return;
  const object = node as Element;
  const data = object.getAttribute('data');
  const type = object.getAttribute('type');
  if (!data || (type !== null && !IMAGE_TYPE.test(type))) return;
  const img = object.ownerDocument.createElement('img');
  img.setAttribute('src', data);
  for (const name of IMAGE_OBJECT_ATTRS) {
    const value = object.getAttribute(name);
    if (value !== null) img.setAttribute(name, value);
  }
  object.after(img, ...object.childNodes);
}

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
  // Security first, then the switches a model setting replaces, which their feature owns.
  FORBID_ATTR: [...MODEL_HTML_FORBIDDEN_ATTRS, ...AUTOPLAY_AUDIO_MARKUP_ATTRS],
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
  purifier.addHook('beforeSanitizeElements', objectToImage);
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
  purifier.addHook('afterSanitizeAttributes', keepAllowedFrame);
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
 * Returns `html` with scripts, event handlers, `javascript:` URLs, frames from outside
 * `FRAME_SOURCES` and the forbidden tags and attributes removed. A link that only plays an
 * `<audio>` keeps working; see `PLAY_AUDIO_ATTR`.
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
