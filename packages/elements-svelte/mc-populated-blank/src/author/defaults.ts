import controllerDefaults, { BLANK_TOKEN } from '../controller/defaults';

/** The model a new item starts from: a valid question an author edits in place. */
export default {
  model: {
    ...controllerDefaults.model,
    prompt: '<p><strong>Demo prompt</strong></p>',
    template: `<p>The answer is ${BLANK_TOKEN}.</p>`,
    choices: [
      { id: 'c1', labelHtml: '<p>Option A</p>' },
      { id: 'c2', labelHtml: '<p>Option B</p>' },
      { id: 'c3', labelHtml: '<p>Option C</p>' },
    ],
    correctChoiceId: 'c2',
  },
  configuration: {
    prompt: {
      label: 'Prompt',
      settings: true,
    },
  },
};
