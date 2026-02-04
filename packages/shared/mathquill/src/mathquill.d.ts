/**
 * Type definitions for mathquill (Desmos fork)
 *
 * The Desmos mathquill fork doesn't export proper types, so we declare them here.
 * These are based on the types in the Desmos fork's src/mathquill.d.ts
 */

declare module 'mathquill' {
  export interface MathQuillInterface {
    getInterface(version: number): MathQuillInterface;
    MathField(element: HTMLElement, config?: MathFieldConfig): MathFieldInterface;
    StaticMath(element: HTMLElement): StaticMathInterface;
  }

  export interface MathFieldConfig {
    [key: string]: any;
  }

  export interface MathFieldInterface {
    latex(): string;
    latex(latexString: string): void;
    focus(): void;
    blur(): void;
    revert(): HTMLElement;
    el(): HTMLElement;
    html(): string;
    text(): string;
    empty(): boolean; // Learnosity extension
  }

  export interface StaticMathInterface {
    latex(): string;
    latex(latexString: string): void;
    revert(): HTMLElement;
    el(): HTMLElement;
    html(): string;
  }

  const MathQuill: MathQuillInterface & {
    getInterface(version: number): MathQuillInterface;
  };

  export default MathQuill;
}

// Support importing from build JS file
declare module 'mathquill/build/mathquill.js' {
  import type { MathQuillInterface } from 'mathquill';
  const MathQuill: MathQuillInterface & {
    getInterface(version: number): MathQuillInterface;
  };
  export default MathQuill;
}

declare module 'mathquill/build/mathquill.css' {
  const content: any;
  export default content;
}
