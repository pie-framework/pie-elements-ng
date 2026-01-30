// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-toolbar/src/utils.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const markFractionBaseSuperscripts = () => {
  document.querySelectorAll('.mq-supsub.mq-sup-only').forEach((supsub) => {
    const prev = supsub.previousElementSibling;

    if (prev && prev.classList.contains('mq-non-leaf') && prev.querySelector('.mq-fraction')) {
      supsub.classList.add('mq-after-fraction-group');
    } else {
      supsub.classList.remove('mq-after-fraction-group');
    }
  });
};
