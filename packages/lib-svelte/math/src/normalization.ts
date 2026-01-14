/**
 * Math Normalization Utilities
 * Ported from @pie-lib/math-rendering
 */

export enum BracketTypes {
  ROUND_BRACKETS = 'round_brackets',
  SQUARE_BRACKETS = 'square_brackets',
  DOLLAR = 'dollar',
  DOUBLE_DOLLAR = 'double_dollar',
}

const PAIRS: Record<BracketTypes, [string, string]> = {
  [BracketTypes.ROUND_BRACKETS]: ['\\(', '\\)'],
  [BracketTypes.SQUARE_BRACKETS]: ['\\[', '\\]'],
  [BracketTypes.DOLLAR]: ['$', '$'],
  [BracketTypes.DOUBLE_DOLLAR]: ['$$', '$$'],
};

export interface UnwrapResult {
  unwrapped: string;
  wrapType: BracketTypes;
}

/**
 * Wrap math content with delimiters
 */
export function wrapMath(content: string, wrapType?: BracketTypes): string {
  let type = wrapType || BracketTypes.ROUND_BRACKETS;

  if (type === BracketTypes.SQUARE_BRACKETS) {
    console.warn('\\[...\\] is not supported yet');
    type = BracketTypes.ROUND_BRACKETS;
  }
  if (type === BracketTypes.DOUBLE_DOLLAR) {
    console.warn('$$...$$ is not supported yet');
    type = BracketTypes.DOLLAR;
  }

  const [start, end] = PAIRS[type];
  return `${start}${content}${end}`;
}

/**
 * Remove math delimiters from content
 */
export function unWrapMath(content: string): UnwrapResult {
  let processedContent = content;

  const displayStyleIndex = content.indexOf('\\displaystyle');
  if (displayStyleIndex !== -1) {
    console.warn('\\displaystyle is not supported - removing');
    processedContent = content.replace('\\displaystyle', '').trim();
  }

  if (processedContent.startsWith('$$') && processedContent.endsWith('$$')) {
    console.warn('$$ syntax is not yet supported');
    return {
      unwrapped: processedContent.substring(2, processedContent.length - 2),
      wrapType: BracketTypes.DOLLAR,
    };
  }
  if (processedContent.startsWith('$') && processedContent.endsWith('$')) {
    return {
      unwrapped: processedContent.substring(1, processedContent.length - 1),
      wrapType: BracketTypes.DOLLAR,
    };
  }

  if (processedContent.startsWith('\\[') && processedContent.endsWith('\\]')) {
    console.warn('\\[..\\] syntax is not yet supported');
    return {
      unwrapped: processedContent.substring(2, processedContent.length - 2),
      wrapType: BracketTypes.ROUND_BRACKETS,
    };
  }

  if (processedContent.startsWith('\\(') && processedContent.endsWith('\\)')) {
    return {
      unwrapped: processedContent.substring(2, processedContent.length - 2),
      wrapType: BracketTypes.ROUND_BRACKETS,
    };
  }

  return {
    unwrapped: processedContent,
    wrapType: BracketTypes.ROUND_BRACKETS,
  };
}
