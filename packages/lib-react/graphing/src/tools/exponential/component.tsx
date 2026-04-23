// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/exponential/component.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import debug from 'debug';
import { buildDataPoints, exponentialFromTwoPoints } from '@pie-lib/graphing-utils';
import { rootEdgeComponent, withRootEdge } from '../shared/line/with-root-edge.js';

const log = debug('pie-lib:graphing:exponential');

const Exponential = withRootEdge((props) => {
  const { root, edge, graphProps } = props;
  const { domain, range } = graphProps;

  const dataPoints =
    edge && edge.x === root.x
      ? []
      : buildDataPoints(domain, range, root, edge, exponentialFromTwoPoints(root, edge), true);

  log('dataPoints:', dataPoints);

  return { root: props.root, edge: props.edge, dataPoints };
});

const Component = rootEdgeComponent(Exponential);

export default Component;
