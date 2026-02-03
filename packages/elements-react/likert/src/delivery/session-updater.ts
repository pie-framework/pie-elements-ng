// @ts-nocheck
/**
 * @synced-from pie-elements/packages/likert/src/session-updater.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export function updateSessionValue(session, data) {
  session.value = session.value || [];
  if (data.selected) {
    session.value = [data.value];
  } else {
    session.value = [];
  }
}
