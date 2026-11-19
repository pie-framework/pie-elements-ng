import type { MathInlineResponse, MathInlineStoredAlternate } from '../types.js';

export const ResponseTypes = {
  advanced: 'Advanced Multi',
  simple: 'Simple',
} as const;

/** The LaTeX of an alternate, which some stored content holds as `{ answer, id }` */
export const alternateLatex = (alternate: string | MathInlineStoredAlternate | undefined): string => {
  if (typeof alternate === 'string') {
    return alternate;
  }
  return typeof alternate?.answer === 'string' ? alternate.answer : '';
};

/** A response's answer, then the LaTeX of each of its alternates */
export const acceptedAnswers = (response: MathInlineResponse): string[] => [
  response.answer,
  ...Object.values(response.alternates || {}).map(alternateLatex),
];
