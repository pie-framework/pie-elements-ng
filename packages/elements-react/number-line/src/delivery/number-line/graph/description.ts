import * as math from 'mathjs';
import { normalizeTicks } from './tick-utils.js';
import { catalogs } from '../../../i18n/index.js';

type EndPoint = 'full' | 'empty';

/** `correct` is set in evaluate mode only. */
export type PlottedElement = { correct?: boolean } & (
  | { type: 'point'; pointType: EndPoint; position: number }
  | { type: 'line'; leftPoint: EndPoint; rightPoint: EndPoint; position: { left: number; right: number } }
  | { type: 'ray'; direction: 'positive' | 'negative'; pointType: EndPoint; position: number }
);

interface DescriptionContext {
  fraction?: boolean;
  language?: string;
}

export interface NumberLineLabelInput extends DescriptionContext {
  domain: { min: number; max: number };
  ticks: { minor: number; major: number };
  width: number;
}

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

/** Names the number line by its range and its tick spacing as drawn, after the width-based limits. */
export function labelNumberLine({ domain, ticks, width, fraction = false, language }: NumberLineLabelInput): string {
  const { minor } = normalizeTicks(domain, width, ticks, { fraction });

  return catalogs.forLocale(language).t('graphLabel', {
    min: formatValue(domain.min, fraction),
    max: formatValue(domain.max, fraction),
    interval: formatValue(minor, fraction),
  });
}

/** Describes each plotted element: its position, whether each endpoint is included, a ray's direction and, in evaluate mode, its correctness. */
export function describePlottedElements(
  elements: readonly PlottedElement[],
  { fraction = false, language }: DescriptionContext = {},
): string {
  const i18n = catalogs.forLocale(language);
  const value = (v: number) => formatValue(v, fraction);
  const end = (point: EndPoint) =>
    i18n.t(point === 'empty' ? 'openEnd' : 'closedEnd');

  const verdict = (element: PlottedElement) =>
    element.correct === true || element.correct === false
      ? ` ${i18n.t(element.correct ? 'elementCorrect' : 'elementIncorrect')}`
      : '';

  const describeElement = (element: PlottedElement): string => {
    switch (element.type) {
      case 'point':
        return i18n.t(element.pointType === 'empty' ? 'pointOpen' : 'pointClosed', {
          position: value(element.position),
        });
      case 'line':
        return i18n.t('line', {
          left: value(element.position.left),
          leftEnd: end(element.leftPoint),
          right: value(element.position.right),
          rightEnd: end(element.rightPoint),
        });
      case 'ray':
        return i18n.t(element.direction === 'negative' ? 'rayLeft' : 'rayRight', {
          position: value(element.position),
          end: end(element.pointType),
        });
      default:
        return '';
    }
  };

  const sentences = elements.map((element) => {
    const sentence = describeElement(element);
    return sentence ? `${sentence}${verdict(element)}` : sentence;
  });

  const described = sentences.filter(Boolean);
  return described.length ? described.join(' ') : i18n.t('plottedNone');
}
