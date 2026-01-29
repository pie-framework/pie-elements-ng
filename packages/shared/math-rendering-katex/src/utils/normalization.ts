/**
 * Math normalization utilities
 *
 * Handles wrapping and unwrapping of math content with LaTeX delimiters.
 */

import { BracketTypes, type BracketType } from '@pie-element/math-rendering';

const PAIRS: Record<BracketType, [string, string]> = {
  [BracketTypes.ROUND_BRACKETS]: ['\\(', '\\)'],
  [BracketTypes.SQUARE_BRACKETS]: ['\\[', '\\]'],
  [BracketTypes.DOLLAR]: ['$', '$'],
  [BracketTypes.DOUBLE_DOLLAR]: ['$$', '$$'],
};

/**
 * Wrap math content with LaTeX delimiters
 */
export const wrapMath = (content: string, wrapType?: BracketType): string => {
  let type = wrapType;

  if (type === BracketTypes.SQUARE_BRACKETS) {
    console.warn('\\[...\\] is not supported yet');
    type = BracketTypes.ROUND_BRACKETS;
  }
  if (type === BracketTypes.DOUBLE_DOLLAR) {
    console.warn('$$...$$ is not supported yet');
    type = BracketTypes.DOLLAR;
  }

  const [start, end] = PAIRS[type as BracketType] || PAIRS[BracketTypes.ROUND_BRACKETS];
  return `${start}${content}${end}`;
};

/**
 * Unwrap math content from LaTeX delimiters
 */
export const unWrapMath = (content: string): { unwrapped: string; wrapType: BracketType } => {
  const displayStyleIndex = content.indexOf('\\displaystyle');
  if (displayStyleIndex !== -1) {
    console.warn('\\displaystyle is not supported - removing');
    content = content.replace('\\displaystyle', '').trim();
  }

  if (content.startsWith('$$') && content.endsWith('$$')) {
    console.warn('$$ syntax is not yet supported');
    return {
      unwrapped: content.substring(2, content.length - 2),
      wrapType: BracketTypes.DOLLAR,
    };
  }
  if (content.startsWith('$') && content.endsWith('$')) {
    return {
      unwrapped: content.substring(1, content.length - 1),
      wrapType: BracketTypes.DOLLAR,
    };
  }

  if (content.startsWith('\\[') && content.endsWith('\\]')) {
    console.warn('\\[..\\] syntax is not yet supported');
    return {
      unwrapped: content.substring(2, content.length - 2),
      wrapType: BracketTypes.ROUND_BRACKETS,
    };
  }

  if (content.startsWith('\\(') && content.endsWith('\\)')) {
    return {
      unwrapped: content.substring(2, content.length - 2),
      wrapType: BracketTypes.ROUND_BRACKETS,
    };
  }

  return {
    unwrapped: content,
    wrapType: BracketTypes.ROUND_BRACKETS,
  };
};

const NEWLINE_BLOCK_REGEX = /\\embed\{newLine\}\[\]/g;
const NEWLINE_LATEX = '\\newline ';

/**
 * Fix a single math element by wrapping/unwrapping its content
 */
export const fixMathElement = (element: Element): void => {
  const el = element as HTMLElement;
  if (el.dataset.mathHandled) {
    return;
  }

  let property: 'innerText' | 'textContent' = 'innerText';

  if (el.textContent) {
    property = 'textContent';
  }

  if (el[property]) {
    el[property] = wrapMath(unWrapMath(el[property] as string).unwrapped);
    // Replace custom newline blocks with valid LaTeX
    el[property] = (el[property] as string).replace(NEWLINE_BLOCK_REGEX, NEWLINE_LATEX);
    el.dataset.mathHandled = 'true';
  }
};

/**
 * Fix all math elements in a container
 */
export const fixMathElements = (el: Document | Element = document): void => {
  const mathElements = el.querySelectorAll('[data-latex]');
  mathElements.forEach((item) => {
    fixMathElement(item);
  });
};
