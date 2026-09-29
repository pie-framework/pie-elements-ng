import type { TranscriptRef } from '@pie-element/shared-types';
import DOMPurify, { type Config } from 'dompurify';

const SAFE_INLINE_LINK_URI =
  /^(?:(?:https?|mailto|tel):|(?:[#/?]|\.{1,2}\/)|(?:[^:/?#]+(?:[/?#]|$)))/i;
const SAFE_EXTERNAL_TRANSCRIPT_URI =
  /^(?:(?:https?):|(?:[#/?]|\.{1,2}\/)|(?:[^:/?#]+(?:[/?#]|$)))/i;

const ALLOWED_TRANSCRIPT_TAGS = [
  'a',
  'b',
  'br',
  'em',
  'i',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'u',
  'ul',
] as const;
const ALLOWED_TRANSCRIPT_ATTRIBUTES = ['dir', 'href', 'hreflang', 'lang', 'title'] as const;
const TRANSCRIPT_TAG_ALLOWLIST = new Set<string>(ALLOWED_TRANSCRIPT_TAGS);
const TRANSCRIPT_ATTRIBUTE_ALLOWLIST = new Set<string>(ALLOWED_TRANSCRIPT_ATTRIBUTES);
const REMOVE_WITH_CONTENT_TAGS = new Set([
  'audio',
  'embed',
  'form',
  'iframe',
  'object',
  'script',
  'style',
  'video',
]);

const TRANSCRIPT_SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [...ALLOWED_TRANSCRIPT_TAGS],
  ALLOWED_ATTR: [...ALLOWED_TRANSCRIPT_ATTRIBUTES],
  ADD_ATTR: ['dir', 'hreflang', 'lang'],
  ALLOWED_URI_REGEXP: SAFE_INLINE_LINK_URI,
  ALLOW_ARIA_ATTR: false,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: [
    'audio',
    'embed',
    'form',
    'iframe',
    'img',
    'input',
    'object',
    'script',
    'source',
    'style',
    'track',
    'video',
  ],
  FORBID_ATTR: ['action', 'formaction', 'src', 'srcdoc', 'srcset', 'style', 'target'],
};

export type TranscriptRenderContent =
  | { kind: 'html'; value: string }
  | { kind: 'plainText'; value: string }
  | { kind: 'external'; value: string }
  | undefined;

function enforceTranscriptAllowlist(html: string): string {
  if (!html || typeof document === 'undefined') {
    return '';
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  for (const element of Array.from(template.content.querySelectorAll('*'))) {
    const tagName = element.localName.toLowerCase();
    if (!TRANSCRIPT_TAG_ALLOWLIST.has(tagName)) {
      if (REMOVE_WITH_CONTENT_TAGS.has(tagName)) {
        element.remove();
      } else {
        element.replaceWith(...Array.from(element.childNodes));
      }
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      if (!TRANSCRIPT_ATTRIBUTE_ALLOWLIST.has(attribute.name.toLowerCase())) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tagName === 'a') {
      const href = element.getAttribute('href');
      if (href && !SAFE_INLINE_LINK_URI.test(href.trim())) {
        element.removeAttribute('href');
      }
    }
  }

  return template.innerHTML;
}

export function sanitizeTranscriptHtml(html: string): string {
  if (!html.trim() || !DOMPurify.isSupported) {
    return '';
  }

  const allowlisted = enforceTranscriptAllowlist(html);
  const sanitized = DOMPurify.sanitize(allowlisted, TRANSCRIPT_SANITIZE_CONFIG);
  return enforceTranscriptAllowlist(sanitized);
}

function hasVisibleText(html: string): boolean {
  if (!html || typeof document === 'undefined') {
    return false;
  }

  const template = document.createElement('template');
  template.innerHTML = html;
  return Boolean(template.content.textContent?.replaceAll('\u00a0', ' ').trim());
}

function safeExternalTranscriptHref(src?: string): string | undefined {
  const href = src?.trim();
  return href && SAFE_EXTERNAL_TRANSCRIPT_URI.test(href) ? href : undefined;
}

export function resolveTranscriptContent(transcript?: TranscriptRef): TranscriptRenderContent {
  if (!transcript) {
    return undefined;
  }

  const html = sanitizeTranscriptHtml(transcript.html ?? '');
  if (hasVisibleText(html)) {
    return { kind: 'html', value: html };
  }

  const plainText = transcript.plainText?.trim();
  if (plainText) {
    return { kind: 'plainText', value: plainText };
  }

  const href = safeExternalTranscriptHref(transcript.src);
  return href ? { kind: 'external', value: href } : undefined;
}

export function hasTranscriptContent(transcript?: TranscriptRef): boolean {
  return resolveTranscriptContent(transcript) !== undefined;
}
