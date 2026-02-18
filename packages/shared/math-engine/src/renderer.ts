import { createMathjaxRenderer } from '@pie-element/shared-math-rendering-mathjax';
import type { RendererAdapter, RendererFeature, RenderRequest } from './types.js';

type MathJaxAdapterOptions = {
  useSingleDollar?: boolean;
  accessibility?: boolean;
};

export function createMathJaxRendererAdapter(options: MathJaxAdapterOptions = {}): RendererAdapter {
  const renderWithMathJax = createMathjaxRenderer({
    useSingleDollar: options.useSingleDollar ?? false,
    accessibility: options.accessibility ?? true,
  });

  const render = async ({ element, latex }: RenderRequest): Promise<void> => {
    element.textContent = latex;
    await renderWithMathJax(element);
  };

  return {
    renderStatic: render,
    renderPreview: render,
    clear: (element: HTMLElement): void => {
      element.textContent = '';
    },
    supportsFeature: (feature: RendererFeature): boolean => {
      return feature === 'static' || feature === 'preview';
    },
  };
}
