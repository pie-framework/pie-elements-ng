// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/sine/component.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import debug from 'debug';
import { sinY, buildDataPoints, getAmplitudeAndFreq, FREQ_DIVIDER } from '@pie-lib/graphing-utils';
import { withRootEdge, rootEdgeComponent } from '../shared/line/with-root-edge';

const log = debug('pie-lib:graphing:sine');

const Sine = withRootEdge((props) => {
  const { root, edge, graphProps } = props;
  const { domain, range } = graphProps;

  const { amplitude, freq } = getAmplitudeAndFreq(root, edge);
  const interval = freq / FREQ_DIVIDER;

  log('[getPoints] amplitude:', amplitude, 'freq:', freq);

  const dataPoints =
    edge && edge.x === root.x
      ? []
      : buildDataPoints(
          { ...domain, step: interval },
          range,
          root,
          edge,
          sinY(amplitude, freq, { phase: root.x, vertical: root.y }),
        );

  return { root: props.root, edge: props.edge, dataPoints };
});

const Component = rootEdgeComponent(Sine);

export default Component;
