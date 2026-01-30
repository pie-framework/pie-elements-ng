// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/configure/src/buttons/circle.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import PropTypes from 'prop-types';
import React from 'react';

export const CircleButton = ({ isActive = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" viewBox="56 0 48 32" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M56 4C56 1.79086 57.7909 0 60 0H99C101.209 0 103 1.79086 103 4V28.0001C103 30.2093 101.209 32.0001 99 32.0001H60C57.7909 32.0001 56 30.2093 56 28.0001V4Z"
      fill={isActive ? '#D3D4D9' : '#ECEDF1'}
    />
    <circle cx="79" cy="16" r="7.5" stroke="black" />
  </svg>
);

CircleButton.propTypes = {
  isActive: PropTypes.bool,
};
