import type { PassageModel } from '../types.js';

// TODO: also update '../../configure/src/defaults.js' and '../../src/print.js' when updating defaults
export default {
  authorEnabled: false, // TODO: should be set to true when all Studio content is updated
  passages: [
    {
      teacherInstructions: '',
      title: '',
      subtitle: '',
      author: '',
      text: '',
    },
  ],
  subtitleEnabled: true,
  teacherInstructionsEnabled: true,
  textEnabled: true,
  titleEnabled: true,
} satisfies Omit<PassageModel, 'id' | 'element'>;
