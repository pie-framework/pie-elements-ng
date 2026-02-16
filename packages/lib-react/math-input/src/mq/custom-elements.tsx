// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/mq/custom-elements.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

const registerLineBreak = function(MQ) {
  MQ.registerEmbed('newLine', () => {
    return {
      htmlString: '<div class="newLine"></div>',
      text: () => 'testText',
      latex: () => '\\embed{newLine}[]',
    };
  });
};

export { registerLineBreak };
