// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/updateSpans.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

// increase the font of parallel notation
const updateSpans = (root?: ParentNode) => {
  const scope = root ?? document;
  const spans = Array.from(scope.querySelectorAll('span[mathquill-command-id]'));
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
