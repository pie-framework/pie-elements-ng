// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/updateSpans.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

// increase the font of parallel notation
const updateSpans = () => {
  const spans = Array.from(document.querySelectorAll('span[mathquill-command-id]'));
  (spans || []).forEach((span) => {
    if (span && span.innerText === '∥' && span.className !== 'mq-editable-field') {
      span.style.fontSize = '32px';
    }

    if ((span.innerText === '′' || span.innerText === '′′') && !span.hasAttribute('data-prime')) {
      span.setAttribute('data-prime', 'true');
    }
  });
};

export { updateSpans };
