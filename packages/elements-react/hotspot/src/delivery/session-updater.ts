// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/src/session-updater.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export function updateSessionValue(session, model, data) {
  const { id, selected } = data;
  const { multipleCorrect } = model || {};
  session.answers = session.answers || [];

  if (!selected) {
    session.answers = session.answers.filter((answer) => answer.id !== id);
  } else {
    const item = { id };
    if (multipleCorrect) {
      session.answers.push(item);
    } else {
      session.answers = [item];
    }

    //update session metadata
    session.selector = data.selector;
  }
}

export function updateSessionMetadata(session, metadata) {
  session.audioStartTime = session.audioStartTime || metadata.audioStartTime; //timestamp when auto-played audio started playing
  session.audioEndTime = session.audioEndTime || metadata.audioEndTime; //timestamp when auto-played audio completed playing

  if (!session.waitTime && session.audioStartTime && session.audioEndTime) {
    // waitTime is elapsed time the user waited for auto-played audio to finish
    session.waitTime = session.audioEndTime - session.audioStartTime;
  }
}
