// @ts-nocheck
/**
 * @synced-from pie-lib/packages/render-ui/src/purpose.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import PropTypes from 'prop-types';
import React from 'react';

const Purpose = (props) => {
  return (
    <>
      {React.Children.map(props.children, (child) => React.cloneElement(child, { 'data-pie-purpose': props.purpose }))}
    </>
  );
};

Purpose.propTypes = {
  children: PropTypes.node,
  purpose: PropTypes.string,
};

export default Purpose;
