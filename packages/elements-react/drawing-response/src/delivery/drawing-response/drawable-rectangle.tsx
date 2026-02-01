// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/src/drawing-response/drawable-rectangle.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { Rect } from 'react-konva';

import DrawableHelper from './drawable-helper';

export default class RectangleDrawable extends DrawableHelper {
  static TYPE = 'RectangleDrawable';
  constructor(props) {
    super(props, RectangleDrawable.TYPE);
    const { startx, starty, x, y } = props;
    this.startx = startx;
    this.starty = starty;
    this.x = x || startx;
    this.y = y || starty;
    this.width = x - startx || 0;
    this.height = y - starty || 0;
  }

  registerMovement(x, y) {
    this.x = x;
    this.y = y;
    this.width = this.x - this.startx;
    this.height = this.y - this.starty;
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
      <Rect
        key={key}
        height={this.height}
        width={this.width}
        fill={this.paintColor || this.fillColor}
        onClick={() => this.handleOnClick(props)}
        onDragEnd={this.handleDragEnd.bind(this, props)}
        onMouseEnter={onMouseOverElement}
        onMouseLeave={onMouseOutElement}
        stroke={this.outlineColor}
        draggable={draggable}
        strokeWidth={2}
        x={this.startx}
        y={this.starty}
      />
    );
  }
}
