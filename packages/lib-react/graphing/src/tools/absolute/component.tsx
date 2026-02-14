// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/absolute/component.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import debug from 'debug';
import { absoluteFromTwoPoints, buildDataPoints } from '@pie-lib/graphing-utils';
import { rootEdgeComponent, withRootEdge } from '../shared/line/with-root-edge';

const log = debug('pie-lib:graphing:absolute');

const Absolute = withRootEdge((props) => {
  const { root, edge, graphProps } = props;
  const { domain, range } = graphProps;

  const dataPoints =
    edge && edge.x === root.x
      ? []
      : buildDataPoints(domain, range, root, edge, absoluteFromTwoPoints(root, edge), true);

  log('dataPoints:', dataPoints);

  return { root: props.root, edge: props.edge, dataPoints, enableCurve: false };
});

const Component = rootEdgeComponent(Absolute);

export default Component;
