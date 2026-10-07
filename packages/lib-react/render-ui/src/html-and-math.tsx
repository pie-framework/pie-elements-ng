// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { sanitizeModelHtml } from '@pie-element/shared-utils';

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
    return <Tag ref={(r) => (this.node = r)} className={className} dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(html) }} />;
  }
}
