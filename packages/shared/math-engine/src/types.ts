export type MathEngineSelection = {
  start: number;
  end: number;
};

export type MatrixType = 'pmatrix' | 'bmatrix' | 'vmatrix' | 'Bmatrix' | 'Vmatrix';

export type MatrixCellLocation = {
  row: number;
  column: number;
};

export type MathEngineStructuredCommand =
  | {
      type: 'lrnexponent';
      base: string;
      exponent: string;
    }
  | {
      type: 'lrnsquaredexponent';
      base: string;
    }
  | {
      type: 'lrnsubscript';
      base: string;
      subscript: string;
    }
  | {
      type: 'matrix';
      matrixType: MatrixType;
      cells: string[][];
    }
  | {
      type: 'symbol';
      name: 'nless' | 'ngtr';
    };

export type MathEngineCommand = string | string[] | MathEngineStructuredCommand;

export type MathEngineHandlers = {
  onChange?: (latex: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onReflow?: () => void;
  onScrollGuard?: () => void;
};

export type MathEngineField = {
  mount: (element: HTMLElement) => void;
  destroy: () => void;
  setLatex: (latex: string) => void;
  getLatex: () => string;
  clear: () => void;
  focus: () => void;
  blur: () => void;
  write: (value: string) => string;
  command: (value: MathEngineCommand) => string;
  keystroke: (value: string) => string;
  selection: () => MathEngineSelection;
};

export type StaticFieldHandle = {
  id: number;
  latex: () => string;
  write: (value: string) => void;
  cmd: (value: MathEngineCommand) => void;
  keystroke: (value: string) => void;
  clear: () => void;
  focus: () => void;
  blur: () => void;
  el: () => HTMLElement | null;
};

export type StaticToken =
  | {
      type: 'text';
      value: string;
    }
  | {
      type: 'field';
      id: string;
      value: string;
    };

export type RendererFeature = 'static' | 'preview' | 'inline';

export type RenderRequest = {
  element: HTMLElement;
  latex: string;
};

export type RendererAdapter = {
  renderStatic: (request: RenderRequest) => Promise<void>;
  renderPreview: (request: RenderRequest) => Promise<void>;
  clear: (element: HTMLElement) => void;
  supportsFeature: (feature: RendererFeature) => boolean;
};

export type MathCommandDescriptor = {
  id: string;
  test: (value: MathEngineCommand) => boolean;
  toLatex: (value: MathEngineCommand) => string;
};
