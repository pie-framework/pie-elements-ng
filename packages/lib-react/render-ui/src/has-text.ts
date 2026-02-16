// @ts-nocheck
/**
 * @synced-from pie-lib/packages/render-ui/src/has-text.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

let parser;

if (typeof window !== 'undefined') {
  parser = new DOMParser();
}

const markupToText = (s) => {
  const root = parser.parseFromString(s, 'text/html');
  return root.body.textContent;
};

export const hasText = (s) => {
  if (!s) {
    return false;
  }
  const tc = markupToText(s);
  return !!(tc && tc.trim());
};
