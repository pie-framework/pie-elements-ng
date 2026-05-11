export interface ChoiceCorrectnessParams {
  isEvaluateMode: boolean;
  correctChoiceId: string;
  selectedId: string;
  showCorrectAnswer: boolean;
}

/**
 * Computes which choice ids should display a correctness badge and what kind.
 *
 * Reveal mode (showCorrectAnswer=true) shows only the canonical correct answer —
 * the student's wrong selection is deliberately suppressed so the UI only
 * highlights what to remember, not what to regret.
 *
 * Unanswered-in-evaluate (selectedId='') treats the correct choice as missed
 * (incorrect badge) rather than triggering the two-badge wrong-answer path.
 */
export function computeChoiceCorrectness(
  params: ChoiceCorrectnessParams
): Map<string, 'correct' | 'incorrect'> {
  const map = new Map<string, 'correct' | 'incorrect'>();
  const { isEvaluateMode, correctChoiceId, selectedId, showCorrectAnswer } = params;

  if (!isEvaluateMode || !correctChoiceId) {
    return map;
  }
  if (showCorrectAnswer) {
    map.set(correctChoiceId, 'correct');
    return map;
  }
  if (!selectedId) {
    map.set(correctChoiceId, 'incorrect');
    return map;
  }
  if (selectedId === correctChoiceId) {
    map.set(correctChoiceId, 'correct');
    return map;
  }
  map.set(selectedId, 'incorrect');
  map.set(correctChoiceId, 'incorrect');
  return map;
}
