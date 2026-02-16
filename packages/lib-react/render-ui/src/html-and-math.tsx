// @ts-nocheck
/**
 * @synced-from pie-lib/packages/render-ui/src/html-and-math.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';

export default class HtmlAndMath extends React.Component {
  static propTypes = {
    tag: PropTypes.string,
    className: PropTypes.string,
    html: PropTypes.string,
  };

  static defaultProps = {
    tag: 'div',
    html: '',
  };

  render() {
    const { tag, className, html } = this.props;
    const Tag = tag || 'div';
    return <Tag ref={(r) => (this.node = r)} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }
}
