import type { ConfigureLanguageOptionsProp } from '@pie-element/shared-types';
import type { NumberLineConfiguration, NumberLineModel, NumberLineResponse } from '../types.js';

export const model = {
  correctResponse: [] as NumberLineResponse[],
  feedback: {
    correct: { default: 'Correct', type: 'none' },
    incorrect: { default: 'Incorrect', type: 'none' },
    partial: { default: 'Nearly', type: 'none' },
  },
  graph: {
    arrows: { left: true, right: true },
    availableTypes: {
      PF: true,
    },
    domain: { min: -1, max: 1 },
    exhibitOnly: false,
    initialElements: [] as NumberLineResponse[],
    initialType: 'PF',
    maxNumberOfPoints: 1,
    ticks: { minor: 0.125, major: 0.5, tickIntervalType: 'Decimal' },
    title: '',
    width: 500,
  },
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
  widthEnabled: true,
} satisfies Omit<NumberLineModel, 'id' | 'element'>;

export const configuration = {
  baseInputConfiguration: {
    h3: { disabled: true },
    audio: { disabled: false },
    video: { disabled: false },
    image: { disabled: false },
    textAlign: { disabled: true },
    showParagraphs: { disabled: false },
  },
  instruction: {
    settings: false,
    enabled: true,
    label:
      'Number line questions involve plotting points or other objects. To create one, first set up the number line, then select the plotting tools students will be offered and use them to define the correct answer.',
  },
  prompt: {
    settings: true,
    label: 'Item Stem',
    required: false,
    inputConfiguration: {
      audio: { disabled: false },
      video: { disabled: false },
      image: { disabled: false },
    },
  },
  rationale: {
    settings: true,
    label: 'Rationale',
    required: false,
    inputConfiguration: {
      audio: { disabled: false },
      video: { disabled: false },
      image: { disabled: false },
    },
  },
  teacherInstructions: {
    settings: true,
    label: 'Teacher Instructions',
    required: false,
    inputConfiguration: {
      audio: { disabled: false },
      video: { disabled: false },
      image: { disabled: false },
    },
  },
  title: {
    label: 'Title',
    settings: true,
    enabled: true,
    inputConfiguration: {
      audio: { disabled: false },
      video: { disabled: false },
      image: { disabled: false },
    },
  },
  numberLineDimensions: {
    settings: true,
    label: 'Width',
    enabled: true,
    min: 200,
    max: 800,
    step: 20,
  },
  mathMlOptions: {
    mmlOutput: false,
    mmlEditing: false,
  },
  language: {
    settings: false,
    label: 'Specify Language',
    enabled: false,
  },
  languageChoices: {
    label: 'Language Choices',
    options: [] as ConfigureLanguageOptionsProp[],
  },
  spellCheck: {
    label: 'Spellcheck',
    settings: false,
    enabled: true,
  },
  maxMaxElements: 20,
  hidePointConfigButtons: false,
  availableTools: ['PF', 'LFF', 'LEF', 'LFE', 'LEE', 'RFN', 'RFP', 'REN', 'REP'],
  settingsPanelDisabled: false,
} satisfies NumberLineConfiguration;

export default { model, configuration };
