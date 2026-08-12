import { DEFAULT_LAYOUT_LIMITS } from '../shared/layoutLimits';

export { DEFAULT_LAYOUT_LIMITS };

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
    layoutProfilePresets: {},
    layoutLimits: { ...DEFAULT_LAYOUT_LIMITS },
    audioButtonSkin: null,
    audioButtonSkinsByLocale: {},
    uiText: {
      answerChoices: 'Answer choices',
      selectedAnswerInSentence: 'blank',
      showCorrectAnswer: 'Show correct answer',
      hideCorrectAnswer: 'Hide correct answer',
      clickToEnableAutoplay: 'Click to enable audio autoplay',
      audioResourceUnavailable: 'Audio is enabled but no playable audio URL is configured.',
      transcriptLabel: 'Transcript',
      listenLabelEn: 'Listen',
      listenLabelEs: 'Escuchar',
      listenSilentAlt: 'Repeat instructions',
      listenPlayingAlt: 'Instructions are playing',
      listenSilentAltEs: 'Escuchar. Repetir las instrucciones.',
      listenPlayingAltEs: 'Escuchar. Estas son las instrucciones.',
    },
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
