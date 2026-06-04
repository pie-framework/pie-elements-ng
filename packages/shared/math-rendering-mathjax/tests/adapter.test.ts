import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMathjaxRenderer } from '../src/adapter.js';
import { mmlToLatex, renderMath, wrapMath } from '../src/render-math.js';

describe('createMathjaxRenderer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    delete window.MathJax;
    delete (window as any)['@pie-lib/math-rendering'];
  });

  it('attaches assistive MathML for screen readers after typesetting', async () => {
    const target = document.createElement('div');
    target.innerHTML = '\\(x^2 + 1\\)';
    document.body.append(target);

    const updatedDocument = {
      assistiveMml: vi.fn(() => {
        const container = target.querySelector('mjx-container');
        const assistiveMath = document.createElement('mjx-assistive-mml');
        assistiveMath.innerHTML =
          '<math><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mn>1</mn></math>';
        container?.append(assistiveMath);
        return updatedDocument;
      }),
      updateDocument: vi.fn(() => updatedDocument),
    };
    const mathDocument = {
      assistiveMml: vi.fn(() => updatedDocument.assistiveMml()),
    };

    window.MathJax = {
      version: '4.0.0',
      startup: {
        defaultReady: vi.fn(),
        document: mathDocument,
      },
      typesetPromise: vi.fn(async () => {
        target.innerHTML = '<mjx-container>x squared plus 1</mjx-container>';
      }),
    };

    await createMathjaxRenderer()(target);

    expect(mathDocument.assistiveMml).toHaveBeenCalled();
    expect(target.querySelector('mjx-assistive-mml math')).not.toBeNull();
  });

  it('loads MathJax when an existing global is missing typesetPromise', async () => {
    const target = document.createElement('div');
    target.innerHTML = '\\(x^2 + 1\\)';
    document.body.append(target);

    window.MathJax = {
      version: '3.2.2',
    } as any;

    const appendChild = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLScriptElement) {
        expect(node.src).toBe('https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js');
        window.MathJax = {
          version: '4.0.0',
          startup: {
            defaultReady: vi.fn(),
          },
          typesetPromise: vi.fn(async () => {
            target.innerHTML = '<mjx-container>x squared plus 1</mjx-container>';
          }),
        };
        node.onload?.(new Event('load'));
      }

      return node;
    });

    await createMathjaxRenderer()(target);

    expect(appendChild).toHaveBeenCalled();
    expect(window.MathJax?.typesetPromise).toHaveBeenCalledWith([target]);
    expect(target.querySelector('mjx-container')).not.toBeNull();
  });

  it('delegates element rendering to the player math renderer when available', async () => {
    const target = document.createElement('div');
    target.innerHTML = '\\(x^2 + 1\\)';
    document.body.append(target);

    const playerRenderMath = vi.fn(async (element: HTMLElement) => {
      element.innerHTML = '<span data-player-rendered>x squared plus 1</span>';
    });
    (window as any)['@pie-lib/math-rendering'] = {
      renderMath: playerRenderMath,
    };

    const appendChild = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLScriptElement) {
        window.MathJax = {
          version: '4.0.0',
          startup: {
            defaultReady: vi.fn(),
          },
          typesetPromise: vi.fn(async () => {}),
        };
        node.onload?.(new Event('load'));
      }

      return node;
    });

    await renderMath(target);

    expect(playerRenderMath).toHaveBeenCalledWith(target);
    expect(appendChild).not.toHaveBeenCalled();
    expect(target.querySelector('[data-player-rendered]')).not.toBeNull();
  });

  it('delegates string rendering to the player math renderer and returns rendered HTML', async () => {
    const playerRenderMath = vi.fn(async (element: HTMLElement) => {
      expect(element.innerHTML).toBe('\\(x^2 + 1\\)');
      element.innerHTML = '<span data-player-rendered>x squared plus 1</span>';
    });
    (window as any)['@pie-lib/math-rendering'] = {
      renderMath: playerRenderMath,
    };

    const appendChild = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node);

    const rendered = await renderMath('\\(x^2 + 1\\)');

    expect(playerRenderMath).toHaveBeenCalledTimes(1);
    expect(appendChild).not.toHaveBeenCalled();
    expect(rendered).toBe('<span data-player-rendered="">x squared plus 1</span>');
  });

  it('delegates safe helper methods to the player math renderer when available', () => {
    const playerWrapMath = vi.fn((latex: string) => `wrapped:${latex}`);
    const playerMmlToLatex = vi.fn((mathml: string) => `latex:${mathml}`);
    (window as any)['@pie-lib/math-rendering'] = {
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
