// @ts-nocheck
/**
 * @synced-from pie-lib/packages/charting/src/bars/bar.js
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
import { types } from '@pie-lib/plot';
import { dataToXBand } from '../utils';
import Bars from './common/bars';

export class Bar extends React.Component {
  static propTypes = {
    data: PropTypes.array,
    onChange: PropTypes.func,
    graphProps: types.GraphPropsType.isRequired,
  };

  render() {
    const props = this.props;
    const { data, graphProps } = props;
    const { scale = {}, size = {} } = graphProps || {};
    const xBand = dataToXBand(scale.x, data, size.width, 'bar');

    return <Bars {...props} xBand={xBand} />;
  }
}

export default () => ({
  type: 'bar',
  Component: Bar,
  name: 'Bar',
});
