// @ts-nocheck
/**
 * @synced-from pie-lib/packages/render-ui/src/readable.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import PropTypes from 'prop-types';
import React from 'react';

const Readable = (props) => {
  return (
    <>
      {React.Children.map(props.children, (child) =>
        React.cloneElement(child, { 'data-pie-readable': props.false === undefined }),
      )}
    </>
  );
};

Readable.propTypes = {
  children: PropTypes.node,
  false: PropTypes.bool,
};

export default Readable;
