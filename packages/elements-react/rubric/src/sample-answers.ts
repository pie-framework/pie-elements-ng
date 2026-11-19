/**
 * Lines `sampleAnswers` up with `points`: one entry per score level, lowest score first.
 *
 * The editor pairs the two lists from the highest score down, and the player paired them from
 * index 0, so the two screens disagreed whenever `sampleAnswers` was the longer list
 * (DNAATD-5648). Stored rubrics got that shape when the editor filled a missing list from its
 * four-slot default. The extra slots sit at the low-score end, so they are dropped from the front,
 * which is what the editor already shows. A shorter list is padded at the high-score end, where
 * both screens already leave the missing entries.
 */
export const alignSampleAnswers = (
  points: readonly unknown[] | undefined,
  sampleAnswers: readonly (string | null)[] | null | undefined,
): (string | null)[] => {
  const size = points?.length ?? 0;
  const answers = Array.isArray(sampleAnswers) ? sampleAnswers : [];

  if (answers.length >= size) {
    return answers.slice(answers.length - size);
  }

  return [...answers, ...Array<null>(size - answers.length).fill(null)];
};
