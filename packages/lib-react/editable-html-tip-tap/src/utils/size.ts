// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/utils/size.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const valueToSize = (v) => {
  if (!v) {
    return;
  }

  const calcRegex = /^calc\((.*)\)$/;

  if (typeof v === 'string') {
    if (v.endsWith('%')) {
      return undefined;
    }

    if (
      v.endsWith('px') ||
      v.endsWith('vh') ||
      v.endsWith('vw') ||
      v.endsWith('ch') ||
      v.endsWith('em') ||
      v.match(calcRegex)
    ) {
      return v;
    }

    const value = parseInt(v, 10);

    return Number.isNaN(value) ? value : `${value}px`;
  }

  if (typeof v === 'number') {
    return `${v}px`;
  }
};
