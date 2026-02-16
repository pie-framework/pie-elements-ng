// @ts-nocheck
/**
 * @synced-from pie-lib/packages/mask-markup/src/componentize.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

const REGEX = /\{\{(\d+)\}\}/g;

export default (s, t) => {
  if (!s) {
    return { markup: '' };
  }

  const markup = s.replace(REGEX, (match, g) => {
    return `<span data-component="${t}" data-id="${g}"></span>`;
  });

  return { markup };
};
