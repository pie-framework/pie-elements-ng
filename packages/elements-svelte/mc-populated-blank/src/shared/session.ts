import type { McPopulatedBlankSession } from '../types.js';

/**
 * The picked choice id. Sessions hold it as multiple-choice does, in a
 * one-entry `value` array; those written before that carry it as `choiceId`,
 * which is still read so they keep scoring and rendering.
 */
export const selectedChoiceId = (session: McPopulatedBlankSession | null | undefined): string =>
  session?.value?.[0] || session?.choiceId || '';
