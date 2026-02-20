export { createField } from './field.js';
export { createStatic } from './static.js';
export { createMathJaxRendererAdapter } from './renderer.js';
export { nextPopupState } from './popup-state.js';
export { usePopupState } from './react.js';
export { parseStaticLatex, composeStaticLatex } from './core/parser.js';
export { parseMatrixLatex } from './core/parser.js';
export { Parser, regexParser, stringParser } from './core/parser-util.js';
export { normalizeLatex, stripSpaces, countBraces } from './core/latex.js';
export { TreeNode, createRoot } from './core/tree.js';
export { MatrixModel } from './commands/matrix-model.js';
export { MathCommandRegistry, getDefaultMathCommandRegistry } from './commands/registry.js';
export { commandToLatex, isEmptyMathValue } from './commands/utils.js';

import { createField } from './field.js';
import { createStatic } from './static.js';

type LegacyMathFieldConfig = {
  handlers?: {
    edited?: () => void;
    edit?: () => void;
    enter?: () => void;
  };
};

type LegacyMathField = {
  latex: (value?: string) => string;
  write: (value: string) => string;
  cmd: (value: string) => string;
  keystroke: (value: string) => string;
  clear: () => void;
  focus: () => void;
  blur: () => void;
  el: () => HTMLElement | null;
};

const createLegacyMathField = (element: HTMLElement, config: LegacyMathFieldConfig = {}): LegacyMathField => {
  const field = createField('', {
    onChange: () => {
      config.handlers?.edit?.();
      config.handlers?.edited?.();
    },
  });
  field.mount(element);

  return {
    latex: (value?: string) => {
      if (typeof value === 'string') {
        field.setLatex(value);
      }
      return field.getLatex();
    },
    write: (value: string) => field.write(value),
    cmd: (value: string) => field.command(value),
    keystroke: (value: string) => field.keystroke(value),
    clear: () => field.clear(),
    focus: () => field.focus(),
    blur: () => field.blur(),
    el: () => element.querySelector('.pie-math-engine-input') as HTMLElement | null,
  };
};

const createLegacyStaticMath = (element: HTMLElement): { latex: (value?: string) => string } => {
  const stat = createStatic();
  stat.mount(element);
  return {
    latex: (value?: string) => {
      if (typeof value === 'string') {
        stat.setLatex(value);
      }
      return stat.getLatex();
    },
  };
};

const legacyInterface = {
  MathField: (element: HTMLElement, config?: LegacyMathFieldConfig): LegacyMathField =>
    createLegacyMathField(element, config),
  StaticMath: (element: HTMLElement): { latex: (value?: string) => string } => createLegacyStaticMath(element),
};

const legacyDefaultExport = {
  getInterface: () => legacyInterface,
  ...legacyInterface,
};

export default legacyDefaultExport;

export type {
  MathEngineField,
  MathEngineHandlers,
  MathEngineSelection,
  MathEngineCommand,
  MathEngineStructuredCommand,
  MathCommandDescriptor,
  MatrixType,
  MatrixCellLocation,
  StaticFieldHandle,
  StaticToken,
  RendererAdapter,
  RenderRequest,
  RendererFeature,
} from './types.js';
