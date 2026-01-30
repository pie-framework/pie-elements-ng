// @ts-nocheck
/**
 * @synced-from pie-lib/packages/render-ui/src/html-and-math.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
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
