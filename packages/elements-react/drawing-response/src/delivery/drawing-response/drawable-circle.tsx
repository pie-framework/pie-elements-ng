// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/src/drawing-response/drawable-circle.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { Circle as CircleImport } from 'react-konva';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
const Circle = unwrapReactInteropSymbol(CircleImport, 'Circle');
import DrawableHelper from './drawable-helper.js';

export default class CircleDrawable extends DrawableHelper {
  static TYPE = 'CircleDrawable';
  constructor(props) {
    super(props, CircleDrawable.TYPE);
    const { startx, starty, x, y } = props;

    this.startx = startx;
    this.starty = starty;
    this.x = x || startx;
    this.y = y || starty;

    const dx = this.startx - this.x;
    const dy = this.starty - this.y;

    this.radius = Math.sqrt(dx * dx + dy * dy);
  }

  registerMovement(x, y) {
    this.x = x;
    this.y = y;

    const dx = this.startx - this.x;
    const dy = this.starty - this.y;

    this.radius = Math.sqrt(dx * dx + dy * dy);
  }

  handleOnClick(props) {
    const { paint, paintColor, forceUpdate } = props;

    if (paint) {
      this.paintColor = paintColor;
      forceUpdate();
    }
  }

  handleDragEnd: any = (props, event) => {
    const deltaX = this.startx - event.target.getX();
    const deltaY = this.starty - event.target.getY();

    this.startx = event.target.getX();
    this.starty = event.target.getY();

    this.x = this.x - deltaX;
    this.y = this.y - deltaY;

    props.handleSessionChange();
  };

  render(props) {
    const { draggable, key, onMouseOverElement, onMouseOutElement } = props;

    return (
      <Circle
        key={key}
        draggable={draggable}
        radius={this.radius}
        x={this.startx}
        y={this.starty}
        fill={this.paintColor || this.fillColor}
        onClick={() => this.handleOnClick(props)}
        onDragEnd={this.handleDragEnd.bind(this, props)}
        onMouseEnter={onMouseOverElement}
        onMouseLeave={onMouseOutElement}
        stroke={this.outlineColor}
      />
    );
  }
}
