// @ts-nocheck
/**
 * @synced-from pie-lib/packages/plot/src/graph-props.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import invariant from 'invariant';
import { snapTo } from './utils';
import { scaleLinear } from 'd3-scale';

const createSnapMinAndMax = ({ min, max, step }) => {
  // for graphing, if step is a value with decimals, we have to calculate the min & max for the grid taking in consideration that 0 has to be exactly in the middle
  // for example, if min: -5 & max: 5 & step: 0.75, in order to keep 0 in the middle we have to set min: -4.5 & max: 4.5

  return {
    step,
    min: parseInt(min / step) * step,
    max: parseInt(max / step) * step,
  };
};

export const create = (domain, range, size, getRootNode) => {
  invariant(domain.min < domain.max, 'domain: min must be less than max');
  invariant(range.min < range.max, 'range: min must be less than max');

  const domainMinMax = createSnapMinAndMax(domain);
  const rangeMinMax = createSnapMinAndMax(range);

  const scale = {
    x: scaleLinear()
      .domain([domain.min, domain.max])
      .range([0, size.width]),
    y: scaleLinear()
      .domain([range.max, range.min])
      .range([0, size.height]),
  };

  const snap = {
    x: snapTo.bind(null, domainMinMax.min, domainMinMax.max, domainMinMax.step),
    y: snapTo.bind(null, rangeMinMax.min, rangeMinMax.max, rangeMinMax.step),
  };

  return { scale, snap, domain, range, size, getRootNode };
};
