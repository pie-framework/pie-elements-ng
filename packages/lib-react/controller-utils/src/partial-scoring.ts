// @ts-nocheck
/**
 * @synced-from pie-lib/packages/controller-utils/src/partial-scoring.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const enabled = (config, env, defaultValue) => {
  // if model.partialScoring = false
  //  - if env.partialScoring = false || env.partialScoring = true => use dichotomous scoring
  // else if model.partialScoring = true || undefined
  //  - if env.partialScoring = false, use dichotomous scoring
  //  - else if env.partialScoring = true, use partial scoring
  config = config || {};
  env = env || {};

  if (config.partialScoring === false) {
    return false;
  }

  if (env.partialScoring === false) {
    return false;
  }

  return typeof defaultValue === 'boolean' ? defaultValue : true;
};
