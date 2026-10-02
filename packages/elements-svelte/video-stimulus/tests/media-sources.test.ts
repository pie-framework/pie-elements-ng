import { describe, expect, it } from 'vitest';
import { isSafeMediaSrc, normalizeMediaSources } from '../src/controller/media-sources.js';

describe('isSafeMediaSrc', () => {
  it('allows the schemes a media element can fetch, in any case', () => {
    for (const src of [
      'https://cdn.example.com/video.mp4',
      'http://cdn.example.com/video.mp4',
      'data:video/mp4;base64,AAAA',
      'blob:https://example.org/0f7e',
      'HTTPS://cdn.example.com/video.mp4',
      'Blob:https://example.org/0f7e',
    ]) {
      expect(isSafeMediaSrc(src), src).toBe(true);
    }
  });

  it('refuses every other scheme, in any case and behind whitespace', () => {
    for (const src of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      '  javascript:alert(1)',
      'vbscript:msgbox(1)',
      'file:///tmp/video.mp4',
      'ftp://example.org/video.mp4',
      'mailto:someone@example.org',
      'C:\\media\\video.mp4',
    ]) {
      expect(isSafeMediaSrc(src), src).toBe(false);
    }
  });

  it('allows relative and protocol-relative URLs, which inherit the document scheme', () => {
    for (const src of [
      '/local/video.mp4',
      'video.mp4',
      './video.mp4',
      '../media/video.mp4',
      '//cdn.example.com/video.mp4',
      'video.mp4?range=0:10',
      '/media/clip:1.mp4',
    ]) {
      expect(isSafeMediaSrc(src), src).toBe(true);
    }
  });

  it('refuses blank and non-string values', () => {
    for (const value of ['', '   ', undefined, null, 42, {}, ['https://cdn.example.com/a.mp4']]) {
      expect(isSafeMediaSrc(value)).toBe(false);
    }
  });
});

describe('normalizeMediaSources', () => {
  it('drops sources whose scheme a media element cannot fetch', () => {
    expect(
      normalizeMediaSources([{ src: 'javascript:alert(1)' }, { src: '/local/asl.mp4' }])
    ).toEqual([{ src: '/local/asl.mp4' }]);
  });

  it('yields nothing when no source has a usable URL', () => {
    expect(normalizeMediaSources([{ src: 'javascript:alert(1)' }])).toEqual([]);
    expect(normalizeMediaSources([])).toEqual([]);
    expect(normalizeMediaSources(undefined)).toEqual([]);
    expect(normalizeMediaSources({ src: 'https://cdn.example.com/a.mp4' })).toEqual([]);
  });

  it('keeps authored order', () => {
    expect(
      normalizeMediaSources([
        { src: 'https://cdn.example.com/asl.webm', type: 'video/webm' },
        { src: 'https://cdn.example.com/asl.mp4', type: 'video/mp4' },
      ]).map((source) => source.src)
    ).toEqual(['https://cdn.example.com/asl.webm', 'https://cdn.example.com/asl.mp4']);
  });

  it('skips entries that are not objects or carry no string src', () => {
    expect(
      normalizeMediaSources([
        null,
        'https://cdn.example.com/bare.mp4',
        42,
        { type: 'video/mp4' },
        { src: 7 },
        { src: 'https://cdn.example.com/a.mp4' },
      ])
    ).toEqual([{ src: 'https://cdn.example.com/a.mp4' }]);
  });

  it('trims src and type, and drops a blank type', () => {
    expect(
      normalizeMediaSources([
        { src: '  https://cdn.example.com/a.mp4  ', type: ' video/mp4 ' },
        { src: 'https://cdn.example.com/b.webm', type: '   ' },
      ])
    ).toEqual([
      { src: 'https://cdn.example.com/a.mp4', type: 'video/mp4' },
      { src: 'https://cdn.example.com/b.webm' },
    ]);
  });

  it('keeps finite dimensions only and carries no other field', () => {
    expect(
      normalizeMediaSources([
        { src: 'https://cdn.example.com/a.mp4', width: 1280, height: 720, bitrate: 2000 },
        { src: 'https://cdn.example.com/b.mp4', width: Number.NaN, height: Infinity },
        { src: 'https://cdn.example.com/c.mp4', width: '640', height: null },
      ])
    ).toEqual([
      { src: 'https://cdn.example.com/a.mp4', width: 1280, height: 720 },
      { src: 'https://cdn.example.com/b.mp4' },
      { src: 'https://cdn.example.com/c.mp4' },
    ]);
  });

  it('deduplicates by trimmed src, keeping the first entry', () => {
    expect(
      normalizeMediaSources([
        { src: 'https://cdn.example.com/a.mp4', type: 'video/mp4' },
        { src: ' https://cdn.example.com/a.mp4 ', type: 'video/quicktime' },
        { src: 'https://cdn.example.com/b.webm', type: 'video/webm' },
      ])
    ).toEqual([
      { src: 'https://cdn.example.com/a.mp4', type: 'video/mp4' },
      { src: 'https://cdn.example.com/b.webm', type: 'video/webm' },
    ]);
  });
});
