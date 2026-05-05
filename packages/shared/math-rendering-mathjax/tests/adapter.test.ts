import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMathjaxRenderer } from '../src/adapter.js';

describe('createMathjaxRenderer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    delete window.MathJax;
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
});
