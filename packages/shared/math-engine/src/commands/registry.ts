import type {
  MathCommandDescriptor,
  MathEngineCommand,
  MathEngineStructuredCommand,
} from '../types.js';
import { MatrixModel } from './matrix-model.js';

function hasType<TType extends MathEngineStructuredCommand['type']>(
  value: MathEngineCommand,
  type: TType
): value is Extract<MathEngineStructuredCommand, { type: TType }> {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === type;
}

const lrnExponentDescriptor: MathCommandDescriptor = {
  id: 'lrnexponent',
  test: (value) => hasType(value, 'lrnexponent'),
  toLatex: (value) => {
    if (!hasType(value, 'lrnexponent')) {
      return '';
    }
    const exponent =
      value.exponent?.trim().length > 1 ? `{${value.exponent}}` : value.exponent || '{ }';
    return `${value.base || ''}^${exponent}`;
  },
};

const lrnSquaredDescriptor: MathCommandDescriptor = {
  id: 'lrnsquaredexponent',
  test: (value) => hasType(value, 'lrnsquaredexponent'),
  toLatex: (value) => {
    if (!hasType(value, 'lrnsquaredexponent')) {
      return '';
    }
    return `${value.base || ''}^2`;
  },
};

const lrnSubscriptDescriptor: MathCommandDescriptor = {
  id: 'lrnsubscript',
  test: (value) => hasType(value, 'lrnsubscript'),
  toLatex: (value) => {
    if (!hasType(value, 'lrnsubscript')) {
      return '';
    }
    return `${value.base || ''}_${value.subscript || ''}`;
  },
};

const matrixDescriptor: MathCommandDescriptor = {
  id: 'matrix',
  test: (value) => hasType(value, 'matrix'),
  toLatex: (value) => {
    if (!hasType(value, 'matrix')) {
      return '';
    }
    return new MatrixModel(value.matrixType, value.cells).toLatex();
  },
};

const symbolDescriptor: MathCommandDescriptor = {
  id: 'symbol',
  test: (value) => hasType(value, 'symbol'),
  toLatex: (value) => {
    if (!hasType(value, 'symbol')) {
      return '';
    }
    return value.name === 'nless' ? '\\nless' : '\\ngtr';
  },
};

const defaultDescriptors = [
  lrnExponentDescriptor,
  lrnSquaredDescriptor,
  lrnSubscriptDescriptor,
  matrixDescriptor,
  symbolDescriptor,
];

export class MathCommandRegistry {
  private readonly descriptors: MathCommandDescriptor[] = [];

  constructor(seed: MathCommandDescriptor[] = defaultDescriptors) {
    seed.forEach((entry) => {
      this.register(entry);
    });
  }

  register(descriptor: MathCommandDescriptor): void {
    if (this.descriptors.find((entry) => entry.id === descriptor.id)) {
      return;
    }
    this.descriptors.push(descriptor);
  }

  toLatex(value: MathEngineCommand): string {
    if (Array.isArray(value)) {
      return value.join('');
    }
    if (typeof value === 'string') {
      return value;
    }

    const descriptor = this.descriptors.find((entry) => entry.test(value));
    return descriptor ? descriptor.toLatex(value) : '';
  }
}

let defaultRegistry: MathCommandRegistry | null = null;

export function getDefaultMathCommandRegistry(): MathCommandRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new MathCommandRegistry();
  }
  return defaultRegistry;
}
