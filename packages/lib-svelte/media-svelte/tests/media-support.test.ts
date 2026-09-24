// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MEDIA_UI_TEXT,
  hasTranscriptContent,
  resolveMediaUiText,
  sanitizeTranscriptHtml,
} from '../src/index.js';

function parseSanitizedHtml(html: string): HTMLDivElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
}

describe('media UI text', () => {
  it('uses English as the default and fallback language', () => {
    expect(resolveMediaUiText(undefined)).toEqual(DEFAULT_MEDIA_UI_TEXT);
    expect(resolveMediaUiText('fr-CA')).toEqual(DEFAULT_MEDIA_UI_TEXT);
  });

  it('resolves Spanish regional tags and applies non-blank overrides last', () => {
    expect(
      resolveMediaUiText('es-MX', {
        showTranscript: '   ',
        hideTranscript: 'Cerrar transcripción',
      })
    ).toEqual({
      showTranscript: 'Mostrar transcripción',
      hideTranscript: 'Cerrar transcripción',
      viewTranscript: 'Ver transcripción',
    });
  });
});

describe('sanitizeTranscriptHtml', () => {
  it('preserves transcript structure, emphasis, safe links, and language metadata', () => {
    const sanitized = sanitizeTranscriptHtml(
      '<p lang="es"><strong>Importante:</strong> lea <em>todo</em>.</p>' +
        '<ul><li><a href="https://example.test/details" hreflang="es">Detalles</a></li></ul>'
    );
    const content = parseSanitizedHtml(sanitized);

    expect(content.querySelector('p')?.lang).toBe('es');
    expect(content.querySelector('strong')?.textContent).toBe('Importante:');
    expect(content.querySelector('em')?.textContent).toBe('todo');
    expect(content.querySelectorAll('li')).toHaveLength(1);
    expect(content.querySelector('a')?.getAttribute('href')).toBe('https://example.test/details');
    expect(content.querySelector('a')?.getAttribute('hreflang')).toBe('es');
  });

  it('strips active content, embedded media, forms, event handlers, and unsafe links', () => {
    const sanitized = sanitizeTranscriptHtml(
      '<script>alert(1)</script><iframe></iframe>' +
        '<form action="/submit"><input name="answer"></form>' +
        '<video src="movie.mp4"></video><img src="pixel.gif">' +
        '<p onclick="alert(1)" style="color:red">Safe text</p>' +
        '<a href="javascript:alert(1)" target="_blank">Unsafe link</a>'
    );
    const content = parseSanitizedHtml(sanitized);

    expect(content.querySelector('script, iframe, form, input, video, img')).toBeNull();
    expect(content.querySelector('p')?.getAttribute('onclick')).toBeNull();
    expect(content.querySelector('p')?.getAttribute('style')).toBeNull();
    expect(content.querySelector('a')?.getAttribute('href')).toBeNull();
    expect(content.querySelector('a')?.getAttribute('target')).toBeNull();
    expect(content.textContent).toContain('Safe text');
  });
});

describe('hasTranscriptContent', () => {
  it('recognizes sanitized HTML, plain text, and safe external transcript links', () => {
    expect(hasTranscriptContent({ html: '<p>Inline transcript</p>' })).toBe(true);
    expect(hasTranscriptContent({ plainText: 'Plain transcript' })).toBe(true);
    expect(hasTranscriptContent({ src: 'https://example.test/transcript' })).toBe(true);
  });

  it('rejects empty, active-only, and unsafe-link-only transcript values', () => {
    expect(hasTranscriptContent(undefined)).toBe(false);
    expect(hasTranscriptContent({ html: ' <p><br></p> ', plainText: '   ' })).toBe(false);
    expect(hasTranscriptContent({ html: '<script>alert(1)</script>' })).toBe(false);
    expect(hasTranscriptContent({ src: 'javascript:alert(1)' })).toBe(false);
  });
});
