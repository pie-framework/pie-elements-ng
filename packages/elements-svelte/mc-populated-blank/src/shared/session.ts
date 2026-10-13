import type { McpbSession } from './types.js';

/**
 * The picked choice id. Sessions hold it as multiple-choice does, in a
 * one-entry `value` array; those written before that carry it as `choiceId`,
 * which is still read so they keep scoring and rendering.
 */
export const selectedChoiceId = (session: McpbSession | null | undefined): string =>
  session?.value?.[0] || session?.choiceId || '';
