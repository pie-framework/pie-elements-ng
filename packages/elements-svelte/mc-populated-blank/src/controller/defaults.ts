/** Token authors must include exactly once in `template` (HTML). */
export const BLANK_TOKEN = '{{blank}}';

export default {
  model: {
    id: '1',
    element: 'mc-populated-blank',
    prompt: '<p><strong>Demo prompt</strong></p>',
    promptEnabled: true,
    interactionMode: 'populate_blank' as const,
    layoutProfile: '',
    choiceLayout: '',
    sentenceHtml: '',
    template: `<p>The answer is ${BLANK_TOKEN}.</p>`,
    choiceMode: 'text' as const,
    choices: [
      { id: 'c1', labelHtml: '<p>Option A</p>' },
      { id: 'c2', labelHtml: '<p>Option B</p>' },
      { id: 'c3', labelHtml: '<p>Option C</p>' },
    ],
    correctChoiceId: 'c2',
    hasAudio: false,
    autoplayAudioEnabled: false,
    completeAudioEnabled: false,
    audioUrl: '',
    audioTranscript: '',
    showVisibleTranscript: false,
    locale: '',
    teacherInstructions: '',
    teacherInstructionsEnabled: false,
  },
  configuration: {
    prompt: {
      label: 'Prompt',
      settings: true,
    },
  },
};
