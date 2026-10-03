import Translator from '@pie-lib/translator';
import * as math from 'mathjs';
import { normalizeTicks } from './tick-utils.js';

const { translator } = Translator;

interface DescribedElement {
  type: string;
}

export interface NumberLineDescriptionInput {
  domain: { min: number; max: number };
  ticks: { minor: number; major: number };
  width: number;
  fraction?: boolean;
  elements: readonly DescribedElement[];
  language?: string;
}

/** Element types in the order the description counts them, with the key that counts each. */
const COUNTED_TYPES = [
  ['point', 'numberLine.pointCount'],
  ['line', 'numberLine.lineCount'],
  ['ray', 'numberLine.rayCount'],
] as const;

/** Formats a value the way the tick labels show it: a fraction in fraction mode, else up to 3 decimals. */
const formatValue = (value: number | math.Fraction, asFraction: boolean): string => {
  const exact = math.fraction(value);
  if (!asFraction) {
    return String(Number(math.number(exact).toFixed(3)));
  }
  // Number() because fraction.js 5 types these parts as BigInt.
  const numerator = Number(exact.s) * Number(exact.n);
  const denominator = Number(exact.d);
  return denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;
};

/**
 * Describes the number line from its model: the range, the tick spacing as drawn (after the
 * width-based limits the ticks apply), and how many points, lines and rays are plotted.
 */
export function describeNumberLine({
  domain,
  ticks,
  width,
  fraction = false,
  elements,
  language,
}: NumberLineDescriptionInput): string {
  const options = { lng: language, interpolation: { escapeValue: false } };
  const { minor } = normalizeTicks(domain, width, ticks, { fraction });

  const range = translator.t('numberLine.graphLabel', {
    ...options,
    min: formatValue(domain.min, fraction),
    max: formatValue(domain.max, fraction),
    interval: formatValue(minor, fraction),
  });

  const counts = COUNTED_TYPES.map(([type, key]) => ({
    key,
    count: elements.filter((element) => element.type === type).length,
  })).filter(({ count }) => count > 0);

  const plotted = counts.length
    ? translator.t('numberLine.plotted', {
        ...options,
        items: counts.map(({ key, count }) => translator.t(key, { ...options, count })).join(', '),
      })
    : translator.t('numberLine.plottedNone', options);

  return `${range} ${plotted}`;
}
