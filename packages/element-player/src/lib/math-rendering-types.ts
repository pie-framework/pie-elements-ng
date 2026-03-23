export type MathRenderer = (element: HTMLElement) => void | Promise<void>;

export interface MathRenderingAPI {
  renderMath: MathRenderer;
  wrapMath?: (latex: string) => string;
  unWrapMath?: (wrapped: string) => string;
  mmlToLatex?: (mathml: string) => string;
}
