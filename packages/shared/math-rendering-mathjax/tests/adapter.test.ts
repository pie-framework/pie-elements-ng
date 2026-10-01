import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { createMathjaxRenderer } from '../src/adapter.js';
import { mmlToLatex, renderMath, wrapMath } from '../src/render-math.js';
import { MATHJAX_CONFLICT_EVENT, UNSUPPORTED_PAGE_DOCS_URL } from '../src/unsupported-page.js';

const MATHJAX_LOADING = Symbol.for('@pie-element/shared-math-rendering-mathjax/loading');
const UNSUPPORTED_PAGE = Symbol.for('@pie-element/shared-math-rendering-mathjax/unsupported-page');
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
 * typesetting methods and creates the document; the startup promise resolves when
 * `finishStartup` is called.
 */
function runMathjaxScript(
  typesetPromise = vi.fn<TypesetPromise>(async () => {}),
  { version = '4.1.3', chtmlStyles = null as HTMLStyleElement | null } = {}
) {
  const config = page.MathJax ?? {};
  let finishStartup!: () => void;
  const promise = new Promise<void>((resolve) => {
    finishStartup = resolve;
  });
  const CHTML = { STYLESHEETID: 'MJX-CHTML-styles' };
  const mathDocument = {
    math: [] as { typesetRoot: Element }[],
    outputJax: { chtmlStyles },
    addRenderAction: vi.fn(),
  };
  const mathJax: any = {
    version,
    config,
    _: { output: { chtml_ts: { CHTML } } },
    startup: {
      promise,
      defaultReady: vi.fn(() => {
        mathJax.stylesheetIdAtStartup = CHTML.STYLESHEETID;
        mathJax.typesetPromise = typesetPromise;
        mathJax.startup.document = mathDocument;
      }),
    },
  };
  page.MathJax = mathJax;
  if (config.startup?.ready) {
    config.startup.ready();
  } else {
    mathJax.startup.defaultReady();
  }
  return { mathJax, typesetPromise, finishStartup, CHTML, mathDocument };
}

/** Output as MathJax 4 produces it: every node records its TeX source. */
const TYPESET_OUTPUT =
  '<mjx-container data-latex="x^2"><mjx-math data-latex="x^2">' +
  '<mjx-msup data-latex="x^2" data-latex-item="x^2"><mjx-mi data-latex="x">x</mjx-mi></mjx-msup>' +
  '</mjx-math><mjx-assistive-mml><math data-latex="x^2"><msup data-latex="x^2"><mi>x</mi></msup>' +
  '</math></mjx-assistive-mml></mjx-container>';

const typesetAs = (html: string) =>
  vi.fn<TypesetPromise>(async (elements = []) => {
    for (const element of elements) element.innerHTML = html;
  });

function conflictEvents() {
  const events: CustomEvent[] = [];
  const listener = (event: Event) => events.push(event as CustomEvent);
  window.addEventListener(MATHJAX_CONFLICT_EVENT, listener);
  onTestFinished(() => window.removeEventListener(MATHJAX_CONFLICT_EVENT, listener));
  return events;
}

function elementWith(html: string): HTMLElement {
  const element = document.createElement('div');
  element.innerHTML = html;
  document.body.append(element);
  return element;
}

/** An element printed by a `<pie-print>`; the legacy print player sets the import flag. */
function printedElementWith(
  html: string,
  player: { mathRenderingModuleUrlImported?: boolean } = {}
): HTMLElement {
  const printPlayer = Object.assign(document.createElement('pie-print'), player);
  const element = document.createElement('div');
  element.innerHTML = html;
  printPlayer.append(element);
  document.body.append(printPlayer);
  return element;
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  delete page.MathJax;
  delete page['@pie-lib/math-rendering'];
  delete page['@pie-lib/math-rendering@2'];
  delete page.renderMath;
  delete (globalThis as any)[MATHJAX_LOADING];
  delete (globalThis as any)[UNSUPPORTED_PAGE];
  for (const style of document.head.querySelectorAll('style')) style.remove();
});

describe('createMathjaxRenderer', () => {
  it('loads the pinned MathJax build with the legacy macros and hidden MathML only', async () => {
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

  it('starts the load on the first render and does not wait on it for content without math', async () => {
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

    expect(scripts).toHaveLength(1);
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    const later = elementWith('\\(x\\)');
    await renderer(later);

    expect(scripts).toHaveLength(1);
    expect(typesetPromise.mock.calls).toEqual([[[later]]]);
  });

  it('leaves a failed load unobserved by renders without math', async () => {
    const scripts = interceptScripts();
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);

    await createMathjaxRenderer()(elementWith('<p>No math</p>'));
    scripts[0].onerror?.(new Event('error'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it.each([
    ['inline TeX', '\\(x\\)'],
    ['display TeX', '\\[x\\]'],
    ['double dollars', '$$x$$'],
    ['an escaped dollar', 'costs \\$5'],
    ['an environment', '\\begin{matrix}1\\end{matrix}'],
    ['MathML', '<math><mi>x</mi></math>'],
    ['a data-latex span', '<span data-latex="">x^3</span>'],
  ])('waits on the load and typesets %s', async (_label, html) => {
    interceptScripts();
    const target = elementWith(html);

    const rendering = createMathjaxRenderer()(target);
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
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

  it('leaves the data-latex content MathJax skips for its ignore class', async () => {
    interceptScripts();
    const target = elementWith(
      [
        '<div class="mathjax_ignore"><span data-latex="">a</span>',
        '<div class="mathjax_process"><span data-latex="">b</span></div></div>',
        '<span class="mathjax_ignore" data-latex="">c</span>',
        '<span class="mathjax_ignore mathjax_process" data-latex="">d</span>',
      ].join('')
    );

    const rendering = createMathjaxRenderer()(target);
    runMathjaxScript().finishStartup();
    await rendering;

    expect([...target.querySelectorAll('[data-latex]')].map((span) => span.textContent)).toEqual([
      'a',
      '\\(b\\)',
      'c',
      '\\(d\\)',
    ]);
  });

  it('decides from the classes from the rendered element down, as MathJax does', async () => {
    interceptScripts();
    // A node view inside an editor typesets itself, and MathJax ignores classes above its root.
    const editor = elementWith('<div><span data-latex="">x</span></div>');
    editor.className = 'mathjax_ignore';
    const nodeView = editor.firstElementChild as HTMLElement;
    const ignoredRoot = elementWith('<span data-latex="">y</span>');
    ignoredRoot.className = 'mathjax_ignore';

    const render = createMathjaxRenderer();
    const rendering = Promise.all([render(nodeView), render(ignoredRoot)]);
    runMathjaxScript().finishStartup();
    await rendering;

    expect(nodeView.textContent).toBe('\\(x\\)');
    expect(ignoredRoot.textContent).toBe('y');
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

  it('gives the MathJax 4 it loads its own stylesheet id before startup', async () => {
    interceptScripts();
    const earlySheet = document.createElement('style');
    earlySheet.id = 'MJX-CHTML-styles';

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathJax, CHTML, finishStartup } = runMathjaxScript(undefined, {
      chtmlStyles: earlySheet,
    });
    finishStartup();
    await rendering;

    expect(mathJax.stylesheetIdAtStartup).toBe('PIE-MJX-CHTML-styles');
    expect(CHTML.STYLESHEETID).toBe('PIE-MJX-CHTML-styles');
    expect(earlySheet.id).toBe('PIE-MJX-CHTML-styles');
  });

  it('leaves the stylesheet id of a srcUrl build that is not MathJax 4', async () => {
    interceptScripts();

    const rendering = createMathjaxRenderer({ srcUrl: 'https://example.test/tex-chtml.js' })(
      elementWith('\\(x\\)')
    );
    const { CHTML, mathDocument, finishStartup } = runMathjaxScript(undefined, {
      version: '3.2.2',
    });
    finishStartup();
    await rendering;

    expect(CHTML.STYLESHEETID).toBe('MJX-CHTML-styles');
    expect(mathDocument.addRenderAction).not.toHaveBeenCalled();
  });

  it('leaves the stylesheet id of a MathJax 4 the page loaded', async () => {
    interceptScripts();
    const CHTML = { STYLESHEETID: 'MJX-CHTML-styles' };
    page.MathJax = {
      version: '4.1.3',
      _: { output: { chtml_ts: { CHTML } } },
      startup: { promise: Promise.resolve() },
      typesetPromise: typesetAs(TYPESET_OUTPUT),
    };
    const target = elementWith('\\(x^2\\)');

    await createMathjaxRenderer()(target);

    expect(CHTML.STYLESHEETID).toBe('MJX-CHTML-styles');
    expect(target.querySelectorAll('[data-latex], [data-latex-item]')).toHaveLength(0);
  });

  it('strips data-latex from its output and keeps it on authored spans', async () => {
    interceptScripts();
    const target = elementWith('\\(x^2\\)');

    const rendering = createMathjaxRenderer()(target);
    const { finishStartup } = runMathjaxScript(
      typesetAs(`<span data-latex="" data-math-handled="true">${TYPESET_OUTPUT}</span>`)
    );
    finishStartup();
    await rendering;

    expect(
      target.querySelectorAll('mjx-container [data-latex], mjx-container [data-latex-item]')
    ).toHaveLength(0);
    expect(target.querySelector('mjx-container')?.hasAttribute('data-latex')).toBe(false);
    expect(target.querySelector('span')?.hasAttribute('data-latex')).toBe(true);
    expect(target.querySelector('mjx-mi')?.textContent).toBe('x');
  });

  it('strips data-latex from the output of MathJax rerenders', async () => {
    interceptScripts();
    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathDocument, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(mathDocument.addRenderAction).toHaveBeenCalledTimes(1);
    const [id, priority, renderDoc, renderMathItem] = mathDocument.addRenderAction.mock.calls[0];
    expect(id).toBe('pie-strip-latex');
    // After MathJax inserts its output, at STATE.INSERTED.
    expect(priority).toBeGreaterThan(200);

    const rerendered = elementWith(TYPESET_OUTPUT).firstElementChild as Element;
    mathDocument.math.push({ typesetRoot: rerendered });
    expect(renderDoc(mathDocument)).toBe(false);
    expect(rerendered.outerHTML).not.toContain('data-latex');

    const toggled = elementWith(TYPESET_OUTPUT).firstElementChild as Element;
    expect(renderMathItem({ typesetRoot: toggled }, mathDocument)).toBe(false);
    expect(toggled.outerHTML).not.toContain('data-latex');
  });

  it('reports a MathJax 3 on window once per page', async () => {
    interceptScripts();
    const events = conflictEvents();
    page.MathJax = {
      version: '3.2.2',
      startup: { promise: Promise.resolve() },
      typesetPromise: vi.fn<TypesetPromise>(async () => {}),
    };
    vi.resetModules();
    const { createMathjaxRenderer: fromOtherBundle } = await import('../src/adapter.js');

    await createMathjaxRenderer()(elementWith('\\(x\\)'));
    await fromOtherBundle()(elementWith('\\(y\\)'));

    expect(console.error).toHaveBeenCalledTimes(1);
    const [message] = vi.mocked(console.error).mock.calls[0];
    expect(message).toContain('mathjax-3-global');
    expect(message).toContain('MathJax 3.2.2');
    expect(message).toContain(UNSUPPORTED_PAGE_DOCS_URL);
    expect(events.map((event) => event.detail)).toEqual([
      { condition: 'mathjax-3-global', message, docsUrl: UNSUPPORTED_PAGE_DOCS_URL },
    ]);
  });

  it("reports another MathJax's output stylesheet in the head", async () => {
    interceptScripts();
    const events = conflictEvents();
    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    runMathjaxScript().finishStartup();
    await rendering;

    const ownMenuStyles = document.createElement('style');
    ownMenuStyles.id = 'MJX-Menu-styles';
    document.head.prepend(ownMenuStyles);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(console.error).not.toHaveBeenCalled();

    const foreign = document.createElement('style');
    foreign.id = 'MJX-CHTML-styles';
    document.head.prepend(foreign);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.error).mock.calls[0][0]).toContain('foreign-output-stylesheet');
    expect(events.map((event) => event.detail.condition)).toEqual(['foreign-output-stylesheet']);
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
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();

    expect(scripts).toHaveLength(1);
    expect(page.MathJax.config.tex.inlineMath).toBeUndefined();
    expect(typesetPromise).not.toHaveBeenCalled();
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
    expect(console.error).not.toHaveBeenCalled();
  });

  it("reports nothing when it delegates to the legacy renderer's MathJax 3", async () => {
    const events = conflictEvents();
    // The legacy renderer sets window.MathJax.version when it loads.
    page.MathJax = { version: '3.2.2', _: {}, config: {} };
    const playerRenderMath = vi.fn();
    page['@pie-lib/math-rendering'] = { renderMath: playerRenderMath };

    await renderMath(elementWith('\\(y\\)'));
    await renderMath(elementWith('\\(z\\)'));

    expect(playerRenderMath).toHaveBeenCalledTimes(2);
    expect(console.error).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("delegates to the legacy print player's renderer inside <pie-print>", async () => {
    const events = conflictEvents();
    page.MathJax = { version: '3.2.2', _: {}, config: {} };
    const printRenderMath = vi.fn();
    page.renderMath = printRenderMath;
    const scripts = interceptScripts();
    const target = printedElementWith('\\(x\\) <span data-latex="">x^3</span>', {
      mathRenderingModuleUrlImported: true,
    });

    await renderMath(target);

    expect(printRenderMath).toHaveBeenCalledWith(target);
    expect(target.querySelector('[data-math-handled]')).toBeNull();
    expect(scripts).toHaveLength(0);
    expect(console.error).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it('finds the print player across a shadow root', async () => {
    const printPlayer = document.createElement('pie-print');
    const host = document.createElement('div');
    printPlayer.append(host);
    document.body.append(printPlayer);
    const target = document.createElement('div');
    target.innerHTML = '\\(x\\)';
    host.attachShadow({ mode: 'open' }).append(target);
    const printRenderMath = vi.fn();
    page.renderMath = printRenderMath;

    await renderMath(target);

    expect(printRenderMath).toHaveBeenCalledWith(target);
  });

  it("waits for the legacy print player's renderer while the player imports it", async () => {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const scripts = interceptScripts();
    const target = printedElementWith('\\(x\\)', { mathRenderingModuleUrlImported: true });

    const rendering = renderMath(target);
    await vi.advanceTimersByTimeAsync(200);
    const printRenderMath = vi.fn();
    page.renderMath = printRenderMath;
    await vi.advanceTimersByTimeAsync(50);
    await rendering;

    expect(printRenderMath).toHaveBeenCalledWith(target);
    expect(scripts).toHaveLength(0);
  });

  it("renders with its own MathJax when the print player's renderer does not arrive", async () => {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const scripts = interceptScripts();
    const target = printedElementWith('\\(x\\)', { mathRenderingModuleUrlImported: true });

    const rendering = renderMath(target);
    await vi.advanceTimersByTimeAsync(9_900);
    expect(scripts).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(200);
    expect(scripts).toHaveLength(1);
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('renders with its own MathJax at once in a <pie-print> that imports no renderer', async () => {
    const scripts = interceptScripts();
    const target = printedElementWith('\\(x\\)');

    const rendering = renderMath(target);
    await vi.waitFor(() => expect(scripts).toHaveLength(1));
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('ignores window.renderMath outside <pie-print>', async () => {
    const scripts = interceptScripts();
    const printRenderMath = vi.fn();
    page.renderMath = printRenderMath;
    const target = elementWith('\\(x\\)');

    const rendering = renderMath(target);
    await vi.waitFor(() => expect(scripts).toHaveLength(1));
    const { finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(printRenderMath).not.toHaveBeenCalled();
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
    const playerWrapMath = vi.fn(
      (latex: string, wrapType?: string | null) => `${wrapType}:${latex}`
    );
    const playerMmlToLatex = vi.fn((mathml: string) => `latex:${mathml}`);
    page['@pie-lib/math-rendering'] = {
      renderMath: vi.fn(),
      wrapMath: playerWrapMath,
      mmlToLatex: playerMmlToLatex,
    };

    expect(wrapMath('x^2', 'dollar')).toBe('dollar:x^2');
    expect(mmlToLatex('<math></math>')).toBe('latex:<math></math>');
    expect(playerWrapMath).toHaveBeenCalledWith('x^2', 'dollar');
    expect(playerMmlToLatex).toHaveBeenCalledWith('<math></math>');
  });
});

describe('wrapMath', () => {
  it('wraps LaTeX as the legacy renderer does when the page renderer has no wrapMath', () => {
    // The player installs a renderer with renderMath alone.
    page['@pie-lib/math-rendering'] = { renderMath: vi.fn() };

    expect(wrapMath('x^2')).toBe('\\(x^2\\)');
    expect(wrapMath('x^2', null)).toBe('\\(x^2\\)');
    expect(wrapMath('x^2', 'round_brackets')).toBe('\\(x^2\\)');
    expect(wrapMath('x^2', 'square_brackets')).toBe('\\(x^2\\)');
    expect(wrapMath('x^2', 'dollar')).toBe('$x^2$');
    expect(wrapMath('x^2', 'double_dollar')).toBe('$x^2$');
  });

  it('wraps LaTeX on a page without a math renderer', () => {
    expect(wrapMath('\\frac{1}{2}')).toBe('\\(\\frac{1}{2}\\)');
  });

  it('keeps one pair of delimiters on LaTeX that already has them', () => {
    expect(wrapMath('\\(x^2\\)')).toBe('\\(x^2\\)');
    expect(wrapMath('\\[x^2\\]')).toBe('\\(x^2\\)');
    expect(wrapMath('$$x^2$$')).toBe('\\(x^2\\)');
    expect(wrapMath('$x^2$', 'dollar')).toBe('$x^2$');
  });

  it('keeps \\displaystyle, which only rendering drops', () => {
    expect(wrapMath('\\displaystyle\\sum_{i=1}^n i')).toBe('\\(\\displaystyle\\sum_{i=1}^n i\\)');
  });
});
