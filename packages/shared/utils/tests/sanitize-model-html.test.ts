// @vitest-environment jsdom
// DOMPurify needs jsdom here; vitest.setup.ts says why.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PLAY_AUDIO_ATTR, sanitizeModelHtml } from '../src/sanitize-model-html';

const parse = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

describe('sanitizeModelHtml', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('plays a Star audio prompt from its link without running the inline handler', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const prompt =
      '<audio id="a.mp3"><source src="https://assets.learnosity.com/a.mp3" type="audio/mpeg"></audio>' +
      '<a href="#" onclick="document.getElementById(\'a.mp3\').play(); return false;">' +
      '<img src="https://assets.learnosity.com/listen.svg" height="128" width="128"></a>';

    document.body.innerHTML = sanitizeModelHtml(prompt);
    const link = document.querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('onclick')).toBeNull();
    expect(link.getAttribute(PLAY_AUDIO_ATTR)).toBe('a.mp3');
    expect(link.getAttribute('href')).toBe('#');
    expect(document.querySelector('audio source')?.getAttribute('src')).toBe(
      'https://assets.learnosity.com/a.mp3'
    );

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    (link.querySelector('img') as HTMLElement).dispatchEvent(click);

    expect(play).toHaveBeenCalledTimes(1);
    expect(play.mock.contexts[0]).toBe(document.getElementById('a.mp3'));
    expect(click.defaultPrevented).toBe(true);
  });

  it.each([
    ['runs more than the play', "document.getElementById('a.mp3').play(); alert(1)"],
    ['plays something other than an element by id', 'window.audio.play(); return false;'],
    ['is any other script', 'alert(1)'],
  ])('drops a link handler that %s', (_, handler) => {
    const out = parse(sanitizeModelHtml(`<a href="#" onclick="${handler}">x</a>`));

    expect(out.querySelector('a')?.hasAttribute('onclick')).toBe(false);
    expect(out.querySelector('a')?.hasAttribute(PLAY_AUDIO_ATTR)).toBe(false);
  });

  it.each([
    [
      'a stack with carries',
      '<math><mstack stackalign="right" charalign="center" charspacing="loose"><mscarries location="n" crossout="updiagonalstrike" position="1"><mscarry location="nw" crossout="none"><mn>1</mn></mscarry><none></none></mscarries><mn>19</mn><msgroup position="0" shift="1"><msrow position="0"><mo>+</mo><mn>3</mn></msrow></msgroup><msline position="0" length="2" leftoverhang="1" rightoverhang="1" mslinethickness="thin"></msline><mn>22</mn></mstack></math>',
    ],
    [
      'a long division',
      '<math><mlongdiv longdivstyle="lefttop"><mn>4</mn><mn>12</mn><mn>48</mn><msline length="1"></msline><mn>8</mn></mlongdiv></math>',
    ],
    ['a line break', '<math><mi>a</mi><mspace linebreak="newline"></mspace><mi>b</mi></math>'],
  ])('keeps elementary math and line breaks: %s', (_, html) => {
    expect(sanitizeModelHtml(html)).toBe(html);
  });

  it.each([
    ['an event handler', '<img src="x.png" onerror="alert(1)">', 'img[onerror]'],
    ['a javascript: link', '<a href="javascript:alert(1)">x</a>', 'a[href]'],
    ['a script', '<p>a</p><script>alert(1)</script>', 'script'],
    ['a style element', '<style>body { display: none }</style><p>a</p>', 'style'],
    ['an SVG style element', '<svg><style>body { display: none }</style></svg>', 'style'],
    ['a form', '<form action="/x"><input name="q"></form>', 'form'],
    ['a base', '<base href="/x/">', 'base'],
    ['a link', '<link rel="stylesheet" href="x.css">', 'link'],
    ['a meta refresh', '<meta http-equiv="refresh" content="0;url=x.html">', 'meta'],
    ['an embed', '<embed src="x.swf">', 'embed'],
    ['an iframe srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>', 'iframe[srcdoc]'],
    ['an iframe javascript: src', '<iframe src="javascript:alert(1)"></iframe>', 'iframe[src]'],
    [
      'a data: iframe',
      '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
      'iframe[src]',
    ],
    [
      'an object javascript: data',
      '<object data="javascript:alert(1)"></object>',
      'object, img[src]',
    ],
    [
      'an SVG animate',
      '<svg><a><animate attributeName="href" values="javascript:alert(1)"/></a></svg>',
      'animate',
    ],
    [
      'a math-embedded handler',
      '<math><mtext><img src="x" onerror="alert(1)"></mtext></math>',
      '[onerror]',
    ],
  ])('removes %s', (_label, html, selector) => {
    expect(parse(sanitizeModelHtml(html)).querySelector(selector)).toBeNull();
  });

  it('removes autoplay, so only the model setting starts prompt audio', () => {
    const out = parse(
      sanitizeModelHtml('<audio autoplay src="a.mp3"></audio><video autoplay></video>')
    );

    expect(out.querySelector('audio')?.hasAttribute('autoplay')).toBe(false);
    expect(out.querySelector('video')?.hasAttribute('autoplay')).toBe(false);
    expect(out.querySelector('audio')?.getAttribute('src')).toBe('a.mp3');
  });

  it('removes an SVG xlink:href', () => {
    const html = '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>';

    expect(sanitizeModelHtml(html)).toBe('<svg><a><text>x</text></a></svg>');
  });

  it('keeps an embedded video iframe with its attributes', () => {
    const html =
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/abc" frameborder="0" ' +
      'allow="autoplay; encrypted-media" allowfullscreen=""></iframe>';
    const iframe = parse(sanitizeModelHtml(html)).querySelector('iframe');

    expect(iframe?.getAttribute('src')).toBe('https://www.youtube.com/embed/abc');
    expect(iframe?.getAttribute('frameborder')).toBe('0');
    expect(iframe?.getAttribute('allow')).toBe('autoplay; encrypted-media');
    expect(iframe?.hasAttribute('allowfullscreen')).toBe(true);
  });

  it.each([
    [
      'a SoundCloud player',
      'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1',
    ],
    ['a Drive preview', 'https://drive.google.com/file/d/abc/preview'],
    ['a PhET simulation', 'https://phet.colorado.edu/sims/html/a/latest/a_en.html'],
  ])('keeps %s frame', (_, src) => {
    const out = parse(sanitizeModelHtml(`<iframe src="${src}"></iframe>`));

    expect(out.querySelector('iframe')?.getAttribute('src')).toBe(src);
  });

  it('loads a protocol-relative frame over https', () => {
    const out = parse(
      sanitizeModelHtml('<iframe src="//content.jwplatform.com/players/abc.html"></iframe>')
    );

    expect(out.querySelector('iframe')?.getAttribute('src')).toBe(
      'https://content.jwplatform.com/players/abc.html'
    );
  });

  it.each([
    ['from an unlisted origin', 'https://collector.example/abc'],
    [
      'on a listed origin outside its embed path',
      'https://www.youtube.com/redirect?q=https://collector.example',
    ],
    ['whose path climbs out of the embed path', 'https://www.youtube.com/embed/../redirect'],
    ['on a path sharing the prefix without the segment', 'https://www.youtube.com/embedx/abc'],
    ['on a listed host over http', 'http://www.youtube.com/embed/abc'],
    ['on a listed host on another port', 'https://www.youtube.com:8443/embed/abc'],
    ['with credentials', 'https://user:pass@www.youtube.com/embed/abc'],
    ['on a host page path', '/embed/abc'],
    ['with no source', ''],
  ])('removes a frame %s', (_, src) => {
    const out = parse(sanitizeModelHtml(`<p>a</p><iframe src="${src}"></iframe>`));

    expect(out.querySelector('iframe')).toBeNull();
    expect(out.querySelector('p')?.textContent).toBe('a');
  });

  it('removes an editor placeholder frame', () => {
    const html =
      '<iframe data-type="video" data-editing="false" frameborder="0" allowfullscreen=""></iframe>';

    expect(parse(sanitizeModelHtml(html)).querySelector('iframe')).toBeNull();
  });

  it('keeps a link from navigating a kept frame', () => {
    const html =
      '<iframe name="player" src="https://player.vimeo.com/video/1"></iframe>' +
      '<a href="https://collector.example" target="player">x</a>';

    expect(parse(sanitizeModelHtml(html)).querySelector('iframe')?.hasAttribute('name')).toBe(
      false
    );
  });

  it('renders an item-bank SVG object as an image', () => {
    const html =
      '<object data="https://itembank.example.com/imagebank/1" type="image/svg+xml" width="600" height="400" alt="A clock"></object>';
    const out = parse(sanitizeModelHtml(html));
    const img = out.querySelector('img');

    expect(out.querySelector('object')).toBeNull();
    expect(img?.getAttribute('src')).toBe('https://itembank.example.com/imagebank/1');
    expect(img?.getAttribute('width')).toBe('600');
    expect(img?.getAttribute('height')).toBe('400');
    expect(img?.getAttribute('alt')).toBe('A clock');
  });

  it('shows the prompt a self-closing object swallowed, after its image', () => {
    const html =
      '<div><p><object data="imagebank/1" type="image/svg+xml"/></p></div>' +
      '<div><p>What time does the clock show?</p></div>';
    const sanitized = sanitizeModelHtml(html);

    expect(sanitized).not.toContain('<object');
    expect(sanitized.indexOf('<img src="imagebank/1"')).toBeGreaterThan(-1);
    expect(sanitized.indexOf('What time does the clock show?')).toBeGreaterThan(
      sanitized.indexOf('<img')
    );
  });

  it('removes an object that holds no image and keeps its fallback', () => {
    const out = parse(
      sanitizeModelHtml(
        '<object data="https://example.com/a.html" type="text/html"><p>fallback</p></object>'
      )
    );

    expect(out.querySelector('object')).toBeNull();
    expect(out.querySelector('img')).toBeNull();
    expect(out.querySelector('p')?.textContent).toBe('fallback');
  });

  it('sanitizes the content a converted object held', () => {
    const out = parse(
      sanitizeModelHtml('<object data="a.svg"><img src="x" onerror="alert(1)"></object>')
    );

    expect(out.querySelector('[onerror]')).toBeNull();
    expect(out.querySelectorAll('img')).toHaveLength(2);
  });

  it('keeps MathML semantics, annotations and prescripts', () => {
    const html =
      '<math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>r</mi></mrow>' +
      '<annotation encoding="latex">r</annotation></semantics>' +
      '<mmultiscripts><mi>X</mi><none/><mi>a</mi><mprescripts/><mi>b</mi><none/></mmultiscripts></math>';
    const out = parse(sanitizeModelHtml(html));

    expect(out.querySelector('semantics > annotation')?.getAttribute('encoding')).toBe('latex');
    expect(out.querySelectorAll('mmultiscripts > none')).toHaveLength(2);
  });

  it('keeps prefixed MathML for the math renderer to re-create', () => {
    const html =
      '<m:math xmlns="http://www.w3.org/1998/Math/MathML"><m:semantics><m:mi>r</m:mi>' +
      '<m:annotation encoding="latex">r</m:annotation></m:semantics></m:math>';

    expect(sanitizeModelHtml(html)).toContain('<m:annotation encoding="latex">r</m:annotation>');
  });

  it('keeps authored presentation and the attributes elements read', () => {
    const html =
      '<p style="text-align: center" class="kds-indent" data-heading="heading1">a</p>' +
      '<img src="https://assets.example.com/i.png" alignment="center" alt="A diagram">' +
      '<a href="https://example.com" target="_blank" rel="noopener">link</a>' +
      '<span data-latex="" data-raw="\\frac{1}{2}">\\(\\frac{1}{2}\\)</span>' +
      '<span data-type="inline_dropdown" data-index="0" data-value=""></span>' +
      '<table border="1"><tbody><tr><td>1</td></tr></tbody></table>' +
      '<audio controls="controls"><source src="https://assets.example.com/a.mp3"></audio>' +
      '<img src="data:image/png;base64,AAAA" alt="">';
    const out = parse(sanitizeModelHtml(html));

    expect(out.querySelector('p')?.getAttribute('style')).toBe('text-align: center');
    expect(out.querySelector('p')?.getAttribute('data-heading')).toBe('heading1');
    expect(out.querySelector('img')?.getAttribute('alignment')).toBe('center');
    expect(out.querySelector('a')?.getAttribute('target')).toBe('_blank');
    expect(out.querySelector('[data-latex]')?.getAttribute('data-raw')).toBe('\\frac{1}{2}');
    expect(out.querySelector('[data-type="inline_dropdown"]')?.getAttribute('data-index')).toBe(
      '0'
    );
    expect(out.querySelector('table')?.getAttribute('border')).toBe('1');
    expect(out.querySelector('audio')?.hasAttribute('controls')).toBe(true);
    expect(out.querySelectorAll('img')[1]?.getAttribute('src')).toBe('data:image/png;base64,AAAA');
  });

  it('keeps the direction and language the editor writes', () => {
    const html =
      '<p dir="rtl" style="text-align: end">ما هو <span lang="en" dir="ltr">pH</span>؟</p>' +
      '<p dir="ltr">Say <span lang="ar-SA" dir="rtl">مرحبا</span> \u200F٣</p>';

    expect(sanitizeModelHtml(html)).toBe(html);
  });

  it('keeps text that only looks like markup', () => {
    expect(sanitizeModelHtml('x &lt; 5 and y &gt; 2')).toBe('x &lt; 5 and y &gt; 2');
  });

  it('renders a non-string value as its text and an absent one as nothing', () => {
    expect(sanitizeModelHtml(0)).toBe('0');
    expect(sanitizeModelHtml(12)).toBe('12');
    expect(sanitizeModelHtml(null)).toBe('');
    expect(sanitizeModelHtml(undefined)).toBe('');
  });
});
