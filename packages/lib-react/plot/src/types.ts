// @ts-nocheck
/**
 * @synced-from pie-lib/packages/plot/src/types.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import PropTypes from 'prop-types';

export const BaseDomainRangeType = {
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number,
};

export const DomainType = PropTypes.shape(BaseDomainRangeType);

export const RangeType = PropTypes.shape(BaseDomainRangeType);

export const SizeType = PropTypes.shape({
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
});

export const PointType = PropTypes.shape({
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
});

export const ChildrenType = PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired;

export const ScaleType = PropTypes.shape({
  x: PropTypes.func.isRequired,
  y: PropTypes.func.isRequired,
});

export const SnapType = PropTypes.shape({
  x: PropTypes.func.isRequired,
  y: PropTypes.func.isRequired,
});

export const GraphPropsType = PropTypes.shape({
  scale: ScaleType.isRequired,
  snap: SnapType.isRequired,
  domain: DomainType.isRequired,
  range: RangeType.isRequired,
  size: SizeType.isRequired,
});


// Local compatibility export used by graphing tool components.
export const ToolPropTypeFields = {
  graphProps: GraphPropsType.isRequired,
  mark: PropTypes.object,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
};

export const ToolPropType = PropTypes.shape(ToolPropTypeFields);
