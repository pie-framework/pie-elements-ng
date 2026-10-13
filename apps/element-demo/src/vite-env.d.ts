/// <reference types="vite/client" />

declare module '@pie-lib/math-rendering-module/module/index.js' {
  export const _dll_pie_lib__math_rendering: {
    renderMath: (element: HTMLElement) => void | Promise<void>;
    wrapMath?: (latex: string) => string;
    unWrapMath?: (wrapped: string) => unknown;
    mmlToLatex?: (mathml: string) => string;
  };
}
