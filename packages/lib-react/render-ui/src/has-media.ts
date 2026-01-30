// @ts-nocheck
/**
 * @synced-from pie-lib/packages/render-ui/src/has-media.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
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

/*
 * Check if the string contains at least one media element.
 */
export const hasMedia = (s) => {
  if (!s) {
    return false;
  }
  const root = parser.parseFromString(s, 'text/html');
  return !!root.body.querySelector('img') || !!root.body.querySelector('video') || !!root.body.querySelector('audio');
};
