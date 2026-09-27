import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMathjaxRenderer } from '../src/adapter.js';
import { mmlToLatex, renderMath, wrapMath } from '../src/render-math.js';

const MATHJAX_LOADING = Symbol.for('@pie-element/shared-math-rendering-mathjax/loading');
const PINNED_SRC = 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-mml-chtml.js';
const SINGLE_DOLLAR_WARNING =
  '[math-rendering] using $ is not advisable, please use $$..$$ or \\(...\\)';

type TypesetPromise = (elements?: Element[]) => Promise<void>;

const page = window as any;

function interceptScripts(): HTMLScriptElement[] {
  const scripts: HTMLScriptElement[] = [];
  vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
    if (node instanceof HTMLScriptElement) scripts.push(node);
    return node;
  });
  return scripts;
}

/**
 * Does what the MathJax script does once its components load: the configuration on
 * window.MathJax becomes MathJax.config and startup.ready runs. defaultReady defines the
 * typesetting methods; the startup promise resolves when `finishStartup` is called.
 */
function runMathjaxScript(typesetPromise = vi.fn<TypesetPromise>(async () => {})) {
  const config = page.MathJax ?? {};
  let finishStartup!: () => void;
  const promise = new Promise<void>((resolve) => {
    finishStartup = resolve;
  });
  const mathJax: any = {
    version: '4.1.3',
    config,
    startup: {
      promise,
      defaultReady: vi.fn(() => {
        mathJax.typesetPromise = typesetPromise;
      }),
    },
  };
  page.MathJax = mathJax;
  if (config.startup?.ready) {
    config.startup.ready();
  } else {
    mathJax.startup.defaultReady();
  }
  return { mathJax, typesetPromise, finishStartup };
}

function elementWith(html: string): HTMLElement {
  const element = document.createElement('div');
  element.innerHTML = html;
  document.body.append(element);
  return element;
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  delete page.MathJax;
  delete page['@pie-lib/math-rendering'];
  delete page['@pie-lib/math-rendering@2'];
  delete (globalThis as any)[MATHJAX_LOADING];
});

describe('createMathjaxRenderer', () => {
  it('loads the pinned MathJax build configured like the legacy renderer', async () => {
    const scripts = interceptScripts();
    const target = elementWith('\\(x^2 + 1\\)');

    const rendering = createMathjaxRenderer()(target);

    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe(PINNED_SRC);
    expect(scripts[0].async).toBe(true);
    const config = page.MathJax;
    expect(config.startup.typeset).toBe(false);
    expect(config.loader.load).toEqual(['a11y/assistive-mml']);
    expect(config.tex).toEqual({
      macros: {
        parallelogram: '\\lower.2em{\\Huge\\unicode{x25B1}}',
        overarc: '\\overparen',
        napprox: '\\not\\approx',
        longdiv: '\\enclose{longdiv}',
        abs: ['\\left|#1\\right|', 1],
      },
    });
    expect(config.options).toEqual({
      enableMenu: true,
      menuOptions: { settings: { assistiveMml: true, enrich: false, inTabOrder: false } },
    });

    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('loads MathJax from srcUrl when one is given', async () => {
    const scripts = interceptScripts();

    const rendering = createMathjaxRenderer({
      srcUrl: 'https://example.test/mathjax/tex-mml-chtml.js',
    })(elementWith('\\(x\\)'));

    expect(scripts.map((script) => script.src)).toEqual([
      'https://example.test/mathjax/tex-mml-chtml.js',
    ]);
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('typesets the element once MathJax startup completes', async () => {
    interceptScripts();
    const target = elementWith('\\(x^2 + 1\\)');
    let settled = false;

    const rendering = createMathjaxRenderer()(target).then(() => {
      settled = true;
    });
    const { mathJax, typesetPromise, finishStartup } = runMathjaxScript();
    await Promise.resolve();
    await Promise.resolve();

    expect(mathJax.startup.defaultReady).toHaveBeenCalledTimes(1);
    expect(typesetPromise).not.toHaveBeenCalled();
    expect(settled).toBe(false);

    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('starts one MathJax load per page however many copies of the adapter render', async () => {
    const scripts = interceptScripts();
    // Each element bundles the adapter, so a page holds one module instance per element.
    vi.resetModules();
    const { createMathjaxRenderer: fromOtherBundle } = await import('../src/adapter.js');
    expect(fromOtherBundle).not.toBe(createMathjaxRenderer);

    const first = elementWith('\\(a\\)');
    const second = elementWith('\\(b\\)');
    const rendering = Promise.all([createMathjaxRenderer()(first), fromOtherBundle()(second)]);

    expect(scripts).toHaveLength(1);
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[first]], [[second]]]);
  });

  it('loads no MathJax for content without math', async () => {
    const scripts = interceptScripts();
    const renderer = createMathjaxRenderer();

    await renderer(
      elementWith(
        '<p>A pen costs $5 and a book costs $10.</p><label><input type="radio"> Yes</label>'
      )
    );
    await renderer(
      elementWith(
        '<mjx-container><mjx-assistive-mml><math><mi>x</mi></math></mjx-assistive-mml></mjx-container>'
      )
    );

    expect(scripts).toHaveLength(0);
    expect(page.MathJax).toBeUndefined();
  });

  it.each([
    ['inline TeX', '\\(x\\)'],
    ['display TeX', '\\[x\\]'],
    ['double dollars', '$$x$$'],
    ['an escaped dollar', 'costs \\$5'],
    ['an environment', '\\begin{matrix}1\\end{matrix}'],
    ['MathML', '<math><mi>x</mi></math>'],
    ['a data-latex span', '<span data-latex="">x^3</span>'],
  ])('loads MathJax for %s', async (_label, html) => {
    const scripts = interceptScripts();

    const rendering = createMathjaxRenderer()(elementWith(html));

    expect(scripts).toHaveLength(1);
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('wraps data-latex content in inline delimiters as the legacy renderer does', async () => {
    interceptScripts();
    const target = elementWith(
      [
        '<span data-latex="" data-raw="x^3">x^3</span>',
        '<span data-latex="">$y$</span>',
        '<span data-latex="">\\displaystyle \\[z\\]</span>',
        '<span data-latex="">a\\embed{newLine}[]b</span>',
        '<span data-latex="" data-math-handled="true">\\(w\\)</span>',
      ].join('')
    );

    const rendering = createMathjaxRenderer()(target);
    runMathjaxScript().finishStartup();
    await rendering;

    expect([...target.querySelectorAll('[data-latex]')].map((span) => span.textContent)).toEqual([
      '\\(x^3\\)',
      '\\(y\\)',
      '\\(z\\)',
      '\\(a\\newline b\\)',
      '\\(w\\)',
    ]);
    expect(target.querySelectorAll('[data-math-handled="true"]')).toHaveLength(5);
  });

  it('leaves the data-latex nodes of typeset output alone on a later render', async () => {
    interceptScripts();
    const typeset =
      '<mjx-container><mjx-math><mjx-mi data-latex="x">x</mjx-mi></mjx-math></mjx-container>';
    const target = elementWith(`${typeset} \\(y\\)`);

    const rendering = createMathjaxRenderer()(target);
    runMathjaxScript().finishStartup();
    await rendering;

    expect(target.querySelector('mjx-mi')?.textContent).toBe('x');
    expect(target.querySelectorAll('[data-math-handled]')).toHaveLength(0);
  });

  it('enables single-dollar delimiters when asked, with the legacy warning', async () => {
    const scripts = interceptScripts();

    const rendering = createMathjaxRenderer({ useSingleDollar: true })(elementWith('costs $5'));

    expect(scripts).toHaveLength(1);
    expect(page.MathJax.tex.inlineMath).toEqual([
      ['$', '$'],
      ['\\(', '\\)'],
    ]);
    expect(page.MathJax.tex.processEscapes).toBe(true);
    expect(console.warn).toHaveBeenCalledWith(SINGLE_DOLLAR_WARNING);
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('uses a MathJax the page already started', async () => {
    const scripts = interceptScripts();
    const typesetPromise = vi.fn<TypesetPromise>(async () => {});
    const hostMathJax = {
      version: '3.2.2',
      startup: { promise: Promise.resolve() },
      typesetPromise,
    };
    page.MathJax = hostMathJax;
    const target = elementWith('\\(x\\)');

    await createMathjaxRenderer()(target);

    expect(scripts).toHaveLength(0);
    expect(page.MathJax).toBe(hostMathJax);
    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('waits for the MathJax the page configured and loads no copy of its own', async () => {
    const scripts = interceptScripts();
    const hostConfig = { tex: { inlineMath: [['$', '$']] }, startup: { typeset: false } };
    page.MathJax = hostConfig;
    const target = elementWith('\\(x\\)');
    let settled = false;

    const rendering = createMathjaxRenderer()(target).then(() => {
      settled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(settled).toBe(false);
    expect(scripts).toHaveLength(0);
    expect(page.MathJax).toBe(hostConfig);
    expect(hostConfig.tex).toEqual({ inlineMath: [['$', '$']] });
    expect(hostConfig.startup.typeset).toBe(false);

    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('runs the startup.ready of the page configuration once', async () => {
    interceptScripts();
    const hostReady = vi.fn(() => page.MathJax.startup.defaultReady());
    page.MathJax = { startup: { ready: hostReady } };
    const target = elementWith('\\(x\\)');

    const rendering = createMathjaxRenderer()(target);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const { mathJax, typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(hostReady).toHaveBeenCalledTimes(1);
    expect(mathJax.startup.defaultReady).toHaveBeenCalledTimes(1);
    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('leaves math untypeset beside a MathJax global without component startup', async () => {
    const scripts = interceptScripts();
    // The global the legacy renderer's bundled MathJax 3 leaves on the page.
    const legacyGlobal = { version: '3.2.2', _: {}, config: {} };
    page.MathJax = legacyGlobal;
    const renderer = createMathjaxRenderer();

    await renderer(elementWith('\\(x\\)'));
    await renderer(elementWith('\\(y\\)'));

    expect(scripts).toHaveLength(0);
    expect(page.MathJax).toBe(legacyGlobal);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('rejects when the MathJax script fails to load', async () => {
    const scripts = interceptScripts();

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    scripts[0].onerror?.(new Event('error'));

    await expect(rendering).rejects.toThrow('Failed to load MathJax');
  });
});

describe('renderMath', () => {
  it('leaves single dollars as text unless the page opts in', async () => {
    const scripts = interceptScripts();
    vi.resetModules();
    const { renderMath: render } = await import('../src/render-math.js');

    await render(elementWith('A pen costs $5 and a book costs $10.'));

    expect(scripts).toHaveLength(0);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('treats single dollars as math when the page sets the legacy opt-in', async () => {
    const scripts = interceptScripts();
    page['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } };
    vi.resetModules();
    const { renderMath: render } = await import('../src/render-math.js');
    const target = elementWith('$x^2$');

    const rendering = render(target);
    await Promise.resolve();

    expect(scripts).toHaveLength(1);
    expect(page.MathJax.tex.inlineMath).toEqual([
      ['$', '$'],
      ['\\(', '\\)'],
    ]);
    expect(console.warn).toHaveBeenCalledWith(SINGLE_DOLLAR_WARNING);
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;
    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('delegates element rendering to the player math renderer when available', async () => {
    const target = elementWith('\\(x^2 + 1\\) <span data-latex="">x^3</span>');
    const playerRenderMath = vi.fn(async (element: HTMLElement) => {
      expect(element.querySelector('[data-latex]')?.textContent).toBe('x^3');
      expect(element.querySelector('[data-math-handled]')).toBeNull();
      element.innerHTML = '<span data-player-rendered>x squared plus 1</span>';
    });
    page['@pie-lib/math-rendering'] = { renderMath: playerRenderMath };
    const scripts = interceptScripts();

    await renderMath(target);

    expect(playerRenderMath).toHaveBeenCalledWith(target);
    expect(scripts).toHaveLength(0);
    expect(target.querySelector('[data-player-rendered]')).not.toBeNull();
  });

  it('delegates string rendering to the player math renderer and returns rendered HTML', async () => {
    const playerRenderMath = vi.fn(async (element: HTMLElement) => {
      expect(element.innerHTML).toBe('\\(x^2 + 1\\)');
      element.innerHTML = '<span data-player-rendered>x squared plus 1</span>';
    });
    page['@pie-lib/math-rendering'] = { renderMath: playerRenderMath };
    const scripts = interceptScripts();

    const rendered = await renderMath('\\(x^2 + 1\\)');

    expect(playerRenderMath).toHaveBeenCalledTimes(1);
    expect(scripts).toHaveLength(0);
    expect(rendered).toBe('<span data-player-rendered="">x squared plus 1</span>');
  });

  it('delegates safe helper methods to the player math renderer when available', () => {
    const playerWrapMath = vi.fn((latex: string) => `wrapped:${latex}`);
    const playerMmlToLatex = vi.fn((mathml: string) => `latex:${mathml}`);
    page['@pie-lib/math-rendering'] = {
      renderMath: vi.fn(),
      wrapMath: playerWrapMath,
      mmlToLatex: playerMmlToLatex,
    };

    expect(wrapMath('x^2')).toBe('wrapped:x^2');
    expect(mmlToLatex('<math></math>')).toBe('latex:<math></math>');
    expect(playerWrapMath).toHaveBeenCalledWith('x^2');
    expect(playerMmlToLatex).toHaveBeenCalledWith('<math></math>');
  });
});
