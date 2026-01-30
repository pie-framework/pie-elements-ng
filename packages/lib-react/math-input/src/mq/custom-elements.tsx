// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/mq/custom-elements.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
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
