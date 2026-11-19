/** A run of the help text: English words, or Arabic letters that render marked as Arabic. */
export type LetterVariantsHelpPart = string | { ar: string };

/**
 * The help text authoring shows under each toggle for `foldLetterVariants`, naming the four
 * variants the fold accepts, so it changes with the fold in `response-normalizer.ts`. It is fixed:
 * hosts reword the toggle's label through configuration.
 */
export const LETTER_VARIANTS_HELP: readonly LetterVariantsHelpPart[] = [
  'Accepts ',
  { ar: 'أ إ آ ٱ' },
  ' as ',
  { ar: 'ا' },
  ', ignores tashkeel, accepts ',
  { ar: 'ه' },
  ' for ',
  { ar: 'ة' },
  ' and ',
  { ar: 'ي' },
  ' for ',
  { ar: 'ى' },
  '.',
];
