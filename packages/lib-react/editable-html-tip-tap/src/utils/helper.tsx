// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/utils/helper.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const normalizeInitialMarkup = (markup) => {
  const trimmed = String(markup ?? '').trim();
  if (!trimmed) return '<div></div>';

  const looksLikeHtml = /<[^>]+>/.test(trimmed);
  if (looksLikeHtml) return trimmed;

  return `<div>${escapeHtml(trimmed)}</div>`;
};
