import { createCorrectResponseSession, model as toViewModel } from '../controller';
import type { McpbQuestion, McpbRole, McpbSession } from '../shared/types';

export interface PrintView {
  model: Record<string, unknown>;
  session: McpbSession | null;
  teacherInstructions: string;
  audioUrl: string;
  audioTranscript: string;
}

/**
 * `pie-print` hands over the item's own model and `options.role`, so print asks
 * the controller for what a player shows that role in `view` mode, in the
 * authored choice order. An instructor's key is the correct-response session,
 * the same path a player shows it through; `printAnswerKey: false` withholds it.
 */
export async function preparePrint(
  question: McpbQuestion,
  role: McpbRole | undefined
): Promise<PrintView> {
  const env = { mode: 'view' as const, role };
  const viewModel = await toViewModel({ ...question, lockChoiceOrder: true }, null, env);
  const key =
    question.printAnswerKey === false
      ? null
      : ((await createCorrectResponseSession(question, env)) as McpbSession | null);
  const { teacherInstructions, audioUrl, audioTranscript, ...model } = viewModel;
  return {
    // Delivery renders these as a collapsed toggle and a player; print writes them out.
    model: { ...model, teacherInstructions: null, hasAudio: false },
    session: key,
    teacherInstructions: String(teacherInstructions || ''),
    audioUrl: String(audioUrl || ''),
    audioTranscript: String(audioTranscript || ''),
  };
}
