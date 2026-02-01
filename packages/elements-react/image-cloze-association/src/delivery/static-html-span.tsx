// @ts-nocheck
/**
 * @synced-from pie-elements/packages/image-cloze-association/src/static-html-span.jsx
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

class StaticHTMLSpan extends React.PureComponent {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    const { html, className } = this.props;

    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
}

StaticHTMLSpan.propTypes = {
  html: PropTypes.string.isRequired,
  className: PropTypes.string,
};

StaticHTMLSpan.defaultProps = {
  className: '',
};

export default StaticHTMLSpan;
