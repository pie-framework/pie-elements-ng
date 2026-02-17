export type KeypadLane = 'numbers' | 'operators' | 'templates';

export type KeyVisualType =
  | 'text'
  | 'icon'
  | 'symbolText'
  | 'fractionTemplate'
  | 'mixedFractionTemplate'
  | 'longdivTemplate'
  | 'squaredTemplate'
  | 'supTemplate'
  | 'subTemplate'
  | 'sqrtTemplate'
  | 'nthRootTemplate'
  | 'parenTemplate'
  | 'bracketTemplate'
  | 'absTemplate'
  | 'logSubTemplate'
  | 'overlineTemplate'
  | 'overArrowTemplate'
  | 'overBiArrowTemplate'
  | 'overArcTemplate';

export interface LegacyKey {
  name?: string;
  label?: string;
  latex?: string;
  write?: string;
  command?: string | string[];
  keystroke?: string;
  icon?: any;
  category?: string;
  ariaLabel?: string;
  actions?: Record<string, unknown>;
  extraProps?: Record<string, unknown>;
}

export interface KeyDefinition {
  id: string;
  lane: KeypadLane;
  visualType: KeyVisualType;
  ariaLabel: string;
  key: LegacyKey;
}

const OPERATOR_NAMES = new Set(['divide', 'multiply', 'minus', 'plus', 'equals']);
const TEMPLATE_LATEX = new Map<string, KeyVisualType>([
  ['\\frac{}{}', 'fractionTemplate'],
  ['\\frac{x}{ }', 'fractionTemplate'],
  ['x\\frac{}{}', 'mixedFractionTemplate'],
  ['\\longdiv{}', 'longdivTemplate'],
  ['x^2', 'squaredTemplate'],
  ['x^{}', 'supTemplate'],
  ['x_{}', 'subTemplate'],
  ['\\sqrt{}', 'sqrtTemplate'],
  ['\\sqrt[{}]{}', 'nthRootTemplate'],
  ['\\left(\\right)', 'parenTemplate'],
  ['\\left[\\right]', 'bracketTemplate'],
  ['\\abs{}', 'absTemplate'],
  ['\\log_{}', 'logSubTemplate'],
  ['\\overline{}', 'overlineTemplate'],
  ['\\overline{x}', 'overlineTemplate'],
  ['\\overline{y}', 'overlineTemplate'],
  ['\\overrightarrow{}', 'overArrowTemplate'],
  ['\\overleftrightarrow{\\overline{}}', 'overBiArrowTemplate'],
  ['\\overleftrightarrow{AB}', 'overBiArrowTemplate'],
  ['\\overarc{\\overline{}}', 'overArcTemplate'],
]);

export const toColumnMajor = (rows: LegacyKey[][]): LegacyKey[] => {
  const padded = [...rows.map((r) => [...r])];
  while (padded.length < 5) {
    padded.push([]);
  }
  const out: LegacyKey[] = [];
  const maxCols = Math.max(...padded.map((row) => row.length), 0);
  for (let col = 0; col < maxCols; col++) {
    for (let row = 0; row < padded.length; row++) {
      const value = padded[row][col];
      if (value) {
        out.push(value);
      }
    }
  }
  return out;
};

const isOperator = (key: LegacyKey): boolean =>
  key.category === 'operators' || (key.name ? OPERATOR_NAMES.has(String(key.name).toLowerCase()) : false);

const getLane = (key: LegacyKey): KeypadLane => {
  if (isOperator(key)) {
    return 'operators';
  }
  if (key.latex || key.command || key.category === 'comparison') {
    return 'templates';
  }
  return 'numbers';
};

const getVisualType = (key: LegacyKey): KeyVisualType => {
  if (key.latex && TEMPLATE_LATEX.has(key.latex)) {
    return TEMPLATE_LATEX.get(key.latex) as KeyVisualType;
  }
  if (key.icon) {
    return 'icon';
  }
  if (key.latex) {
    return 'symbolText';
  }
  return 'text';
};

export const getAriaLabel = (key: LegacyKey): string => {
  return key.ariaLabel || key.name || key.label || key.latex || 'keypad action';
};

export const toDefinition = (key: LegacyKey, index: number): KeyDefinition => ({
  id: `${key.label || key.latex || key.name || key.command || 'key'}-${index}`,
  lane: getLane(key),
  visualType: getVisualType(key),
  ariaLabel: getAriaLabel(key),
  key,
});

export const buildKeyDefinitions = (orderedKeys: LegacyKey[]): KeyDefinition[] => {
  return orderedKeys.map((k, idx) => toDefinition(k, idx)).filter((k) => Boolean(k.key && k.ariaLabel));
};

export const laneDefinitions = (definitions: KeyDefinition[]): Record<KeypadLane, KeyDefinition[]> => {
  return definitions.reduce(
    (acc, definition) => {
      acc[definition.lane].push(definition);
      return acc;
    },
    { numbers: [], operators: [], templates: [] } as Record<KeypadLane, KeyDefinition[]>,
  );
};

export const toLaneGrid = (items: KeyDefinition[], rowCount = 5): (KeyDefinition | null)[][] => {
  const cols = Math.max(1, Math.ceil(items.length / rowCount));
  const grid: (KeyDefinition | null)[][] = Array.from({ length: rowCount }, () => Array.from({ length: cols }, () => null));
  items.forEach((item, idx) => {
    const row = idx % rowCount;
    const col = Math.floor(idx / rowCount);
    grid[row][col] = item;
  });
  return grid;
};
