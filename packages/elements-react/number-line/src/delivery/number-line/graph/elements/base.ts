// @ts-nocheck
/**
 * @synced-from pie-elements/packages/number-line/src/number-line/graph/elements/base.js
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
