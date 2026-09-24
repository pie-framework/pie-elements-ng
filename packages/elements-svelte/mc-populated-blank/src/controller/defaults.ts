import { DEFAULT_LAYOUT_LIMITS } from '../shared/layoutLimits';

export { DEFAULT_LAYOUT_LIMITS };

/** Token authors must include exactly once in `template` (HTML). */
export const BLANK_TOKEN = '{{blank}}';

/**
 * The values `normalize` fills in for fields an item leaves out. They carry no
 * content and no `id` or `element`: those come from the item config, and a
 * default here would stand in for a field the author never set.
 */
export default {
  model: {
    prompt: '',
    promptEnabled: true,
    interactionMode: 'populate_blank' as const,
    layoutProfile: '',
    choiceLayout: '',
    layoutProfilePresets: {},
    layoutLimits: { ...DEFAULT_LAYOUT_LIMITS },
    audioButtonSkin: null,
    audioButtonSkinsByLocale: {},
    sentenceHtml: '',
    template: '',
    choiceMode: 'text' as const,
    choices: [],
    choiceGroupLabel: '',
    correctChoiceId: '',
    hasAudio: false,
    autoplayAudioEnabled: false,
    completeAudioEnabled: false,
    audioUrl: '',
    audioTranscript: '',
    locale: '',
    teacherInstructions: '',
    teacherInstructionsEnabled: true,
  },
};
