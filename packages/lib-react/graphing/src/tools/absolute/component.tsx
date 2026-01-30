// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/absolute/component.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import debug from 'debug';
import { buildDataPoints, absoluteFromTwoPoints } from '@pie-lib/graphing-utils';
import { withRootEdge, rootEdgeComponent } from '../shared/line/with-root-edge';

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
