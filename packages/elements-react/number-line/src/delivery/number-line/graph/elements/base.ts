// @ts-nocheck
/**
 * @synced-from pie-elements/packages/number-line/src/number-line/graph/elements/base.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react'; //eslint-disable-line
import PropTypes from 'prop-types';

export const basePropTypes = () => ({
  interval: PropTypes.number.isRequired,
  domain: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }),
});
