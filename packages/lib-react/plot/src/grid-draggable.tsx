// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { GraphPropsType } from './types.js';
import { DraggableCore } from './draggable.js';
import debug from 'debug';
import * as utils from './utils.js';
import { isFunction } from '@pie-element/shared-lodash';
import invariant from 'invariant';
import { pointer } from 'd3-selection';

const log = debug('pie-lib:plot:grid-draggable');

export const deltaFn = (scale, snap, val) => (delta) => {
  const normalized = delta + scale(0);
  const inverted = scale.invert(normalized);

  const fixDecimalsArithmetic = (snap(val + inverted).toFixed(4) * 1000) / 1000;

  return fixDecimalsArithmetic;
};

/**
 * Creates a Component that is draggable, within a bounded grid.
 * @param {*} opts
 */
export const gridDraggable = (opts) => (Comp) => {
  invariant(
    !!opts && isFunction(opts.fromDelta) && isFunction(opts.bounds) && isFunction(opts.anchorPoint),
    'You must supply an object with: { anchorPoint: Function, fromDelta: Function, bounds: Function }',
  );

  // DraggableCore needs a DOM node for its touchstart listener, and finds one with
  // ReactDOM.findDOMNode unless it gets a nodeRef; React 19 removes findDOMNode. The <g> supplies
  // that node, and the mouse and touch-end handlers DraggableCore clones onto its child still
  // reach Comp, so the mouse drag target stays where Comp puts it.
  const DragNode = ({ dragNodeRef, ...props }) => (
    <g ref={dragNodeRef}>
      <Comp {...props} />
    </g>
  );

  return class GridDraggable extends React.Component {
    static propTypes = {
      disabled: PropTypes.bool,
      onDragStart: PropTypes.func,
      onDrag: PropTypes.func,
      onDragStop: PropTypes.func,
      onClick: PropTypes.func,
      onMove: PropTypes.func,
      graphProps: GraphPropsType.isRequired,
    };

    nodeRef = React.createRef();

    constructor(props) {
      super(props);
      this.state = {
        startX: null,
        startY: null,
      };
    }

    grid: any = () => {
      const { graphProps } = this.props;
      const { scale, domain, range } = graphProps;
      return {
        x: scale.x(domain.step) - scale.x(0),
        y: scale.y(range.step) - scale.y(0),
      };
    };
    onStart: any = (e) => {
      const { onDragStart } = this.props;
      if (document.activeElement) {
        document.activeElement.blur();
      }
      this._didDrag = false;
      // react-draggable reports each delta since the previous event, and the owner re-anchors
      // on the value it was handed. Keep the props the drag began with and the movement since,
      // so every event is applied against one fixed anchor and none can be lost.
      this._startProps = this.props;
      this._total = { x: 0, y: 0 };
      this.setState({ startX: e.clientX, startY: e.clientY });

      // Intercept the native 'click' event that the browser fires after mouseup.
      // We use a one-time capture-phase listener so we can suppress it when a
      // real drag occurred, preventing Bg's d3 click listener from creating a new mark.
      const target = e.target;
      const onNativeClick = (clickEvent) => {
        target.removeEventListener('click', onNativeClick, true);
        if (this._didDrag) {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        }
      };
      target.addEventListener('click', onNativeClick, true);

      if (onDragStart) {
        onDragStart();
      }
    };
    position: any = (props = this.props) => {
      const { x, y } = opts.anchorPoint(props);
      const { graphProps } = this.props;
      const { scale, snap } = graphProps;

      return {
        anchorPoint: {
          x,
          y,
        },
        x: deltaFn(scale.x, snap.x, x),
        y: deltaFn(scale.y, snap.y, y),
      };
    };

    tiny: any = (key, event) => {
      const K = key.toUpperCase();
      const end = event[`client${K}`];
      const start = this.state[`start${K}`];
      const delta = Math.abs(end - start);
      const out = delta < Math.abs(this.grid()[key]) / 10;
      log('[tiny] key: ', key, 'delta: ', delta, 'out: ', out);
      return out;
    };

    getScaledBounds: any = (props = this.props) => {
      const bounds = opts.bounds(props, props.graphProps);
      log('bounds: ', bounds);
      // bounds are in domain/range units, so convert with the pixels in one unit, not in one step
      const { scale } = props.graphProps;
      const unit = { x: scale.x(1) - scale.x(0), y: scale.y(1) - scale.y(0) };

      let scaled = {
        left: bounds.left * unit.x,
        right: bounds.right * unit.x,
        top: bounds.top * unit.y,
        bottom: bounds.bottom * unit.y,
      };

      // Normalize Y bounds so that top is <= 0 and bottom is >= 0. This compensates for the
      // inverted Y scale (range.max -> 0, range.min -> size.height).
      scaled = {
        ...scaled,
        top: Math.min(0, scaled.top),
        bottom: Math.abs(scaled.bottom),
      };

      log('[getScaledBounds]: ', scaled);
      return scaled;
    };

    onDrag: any = (e, dd) => {
      const { onDrag, disabled } = this.props;

      // Track drag movement BEFORE any early returns so that onStop always
      // knows a real drag occurred, even when onDrag prop is absent or disabled.
      if (Math.abs(dd.deltaX) > 1 || Math.abs(dd.deltaY) > 1) {
        this._didDrag = true;
      }

      if (!onDrag || disabled) {
        return;
      }

      const startProps = this._startProps || this.props;
      const total = this._total || { x: 0, y: 0 };
      total.x += dd.deltaX;
      total.y += dd.deltaY;
      this._total = total;

      // Keep the handle at the edge of the domain/range rather than ignoring movement past it:
      // the pointer leaving the axes (or a fast flick) must not desynchronise handle and cursor.
      const bounds = this.getScaledBounds(startProps);
      const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
      const dragArg = this.applyDelta(
        {
          x: clamp(total.x, bounds.left < 0 ? bounds.left : -Infinity, bounds.right > 0 ? bounds.right : Infinity),
          y: clamp(total.y, bounds.top, bounds.bottom),
        },
        startProps,
      );

      if (dragArg !== undefined || dragArg !== null) {
        onDrag(dragArg);
      }
    };

    getDelta: any = (point, props) => {
      const pos = this.position(props);

      const p = {
        x: pos.x(point.x),
        y: pos.y(point.y),
      };

      return utils.getDelta(pos.anchorPoint, p);
    };

    applyDelta: any = (point, props = this.props) => {
      const delta = this.getDelta(point, props);
      log('[applyDelta] delta:', delta);
      return opts.fromDelta(props, delta);
    };

    /**
     * Must not return false. react-draggable v4 treats a false return as "keep dragging"
     * and bails out of handleDragStop before it detaches the document mousemove/mouseup
     * listeners, so the handle would keep following the pointer after release - and every
     * previously dragged handle would move along with the next one. (v3 ignored the
     * return value and always detached, which is why returning false used to look inert.)
     */
    onStop: any = (e, dd) => {
      log('[onStop] dd:', dd);
      const { onDragStop, onClick, disabled } = this.props;

      if (onDragStop && !disabled) {
        onDragStop();
      }

      log('[onStop] lastX/Y: ', dd.lastX, dd.lastY);
      const isClick = !this._didDrag;

      if (isClick) {
        // For non-disabled marks, stop propagation so the Bg d3 listener
        // doesn't also create a new mark on top of this one.
        // Disabled/background marks allow propagation so Bg can handle the click.
        if (!disabled && typeof e?.stopPropagation === 'function') {
          e.stopPropagation();
        }

        if (onClick) {
          log('call onClick');
          this.setState({ startX: null, startY: null });
          const { graphProps } = this.props;
          const { scale, snap } = graphProps;
          try {
            const [rawX, rawY] = pointer(e, e.target);
            let x = scale.x.invert(rawX);
            let y = scale.y.invert(rawY);
            x = snap.x(x);
            y = snap.y(y);
            onClick({ x, y });
          } catch (_) {
            // pointer() can fail on SVG elements (e.g. <circle>) that lack a valid
            // coordinate transform. Label-mode callbacks use props data, not coords.
            onClick({});
          }
        }

        this.setState({ startX: null, startY: null });
        return;
      }

      this.setState({ startX: null, startY: null });
    };

    render() {
      // we extract onClick here to prevent it from being passed to the DraggableCore
      // and to prevent it from being included in the ...rest that gets passed to the Comp
      // because otherwise it is called on every drag event
      // eslint-disable-next-line no-unused-vars
      const { disabled, onClick, ...rest } = this.props;
      const grid = this.grid();

      // Prevent the text-select icon from rendering. DraggableCore invokes this same
      // `onMouseDown` prop for BOTH a real mousedown (a React SyntheticEvent, wrapping
      // the native event under `.nativeEvent`) and a touchstart (added via a plain
      // native addEventListener, so `e` IS the native event directly, with no
      // `.nativeEvent` wrapper) - see react-draggable's DraggableCore.handleDragStart,
      // which calls `this.props.onMouseDown(e)` from both its onMouseDown and
      // onTouchStart handlers. Reaching for `e.nativeEvent.preventDefault()`
      // unconditionally threw on every touchstart (`e.nativeEvent` is undefined),
      // which aborted handleDragStart before it could attach DraggableCore's own
      // move/end listeners - the drag silently never started on touch devices
      // (PIE-1074). Falling back to `e` itself when `.nativeEvent` is absent handles
      // both cases, and calling preventDefault() on the touchstart is itself required
      // for the browser to keep routing the gesture to us instead of hijacking it as a
      // page scroll after the first uncancelled touchmove.
      const onMouseDown = (e) => (e.nativeEvent || e).preventDefault();

      /**
       * TODO: This shouldnt be necessary, we should be able to use the r-d classnames.
       * But they aren't being unset. If we continue with this lib, we'll have to fix this.
       */
      const isDragging = this.state ? !!this.state.startX : false;

      return (
        <DraggableCore
          nodeRef={this.nodeRef}
          onMouseDown={onMouseDown}
          onStart={this.onStart}
          onDrag={this.onDrag}
          onStop={this.onStop}
          axis={opts.axis || 'both'}
          grid={[grid.x, grid.y]}
        >
          <DragNode
            dragNodeRef={this.nodeRef}
            {...rest}
            disabled={disabled}
            isDragging={isDragging}
            onClick={isDragging ? undefined : onClick}
          />
        </DraggableCore>
      );
    }
  };
};
