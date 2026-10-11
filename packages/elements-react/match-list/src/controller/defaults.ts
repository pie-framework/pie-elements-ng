import type { MatchListAnswer, MatchListModel, MatchListPrompt } from '../types.js';

export default {
  config: {
    answers: [] as MatchListAnswer[],
    prompt: '',
    prompts: [] as MatchListPrompt[],
    shuffled: false,
  },
} satisfies Omit<MatchListModel, 'id' | 'element'>;
