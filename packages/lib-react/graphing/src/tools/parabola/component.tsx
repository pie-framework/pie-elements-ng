// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/parabola/component.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import debug from 'debug';
import { buildDataPoints, parabolaFromTwoPoints } from '@pie-lib/graphing-utils';
import { withRootEdge, rootEdgeComponent } from '../shared/line/with-root-edge';

const log = debug('pie-lib:graphing:parabola');

const Parabola = withRootEdge((props) => {
  const { root, edge, graphProps } = props;
  const { domain, range } = graphProps;

  const dataPoints =
    edge && edge.x === root.x
      ? []
      : buildDataPoints(domain, range, root, edge, parabolaFromTwoPoints(root, edge), true);

  log('dataPoints:', dataPoints);

  return { root: props.root, edge: props.edge, dataPoints };
});

const Component = rootEdgeComponent(Parabola);

export default Component;
