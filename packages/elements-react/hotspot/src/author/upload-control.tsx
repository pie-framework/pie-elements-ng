// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/configure/src/upload-control.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';

import Button from './button';

const UploadControl = ({ label, onInputClick, onUploadImage, setRef }) => (
  <>
    <Button label={label} onClick={onInputClick} />
    <input
      accept="image/*"
      style={{ display: 'none' }}
      onChange={onUploadImage}
      ref={(ref) => {
        setRef(ref);
      }}
      type="file"
    />
  </>
);

UploadControl.propTypes = {
  label: PropTypes.string.isRequired,
  onInputClick: PropTypes.func.isRequired,
  onUploadImage: PropTypes.func.isRequired,
  setRef: PropTypes.func.isRequired,
};

UploadControl.defaultProps = {
  classNameButton: '',
  classNameSection: '',
};

export default UploadControl;
