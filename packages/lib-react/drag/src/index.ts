// @ts-nocheck

import PlaceHolder from './placeholder.js';
import DraggableChoice from './draggable-choice.js';
import DragProvider from './drag-provider.js';
import swap from './swap.js';
import * as uid from './uid-context.js';
import MatchDroppablePlaceholder from './match-list-dp.js';
import DragDroppablePlaceholder from './drag-in-the-blank-dp.js';
import ICADroppablePlaceholder from './ica-dp.js';
import { useDraggableControl } from './draggable-control.js';
import { useDropTarget } from './drop-target.js';
import { createDragCollision } from './collision.js';
import { motionSafeDropAnimation } from './drop-animation.js';
import { ANNOUNCEMENT_CLEAR_MS, LiveAnnouncer, nextAnnouncement } from './live-announcer.js';
import { DRAGGABLE_MARKER, draggableAttributes } from './draggable-attributes.js';

export type {
  ContentNamer,
  DraggableControl,
  DraggableControlOptions,
  DraggableControlProps,
} from './draggable-control.js';
export type { DropTarget, DropTargetOptions, DropTargetProps } from './drop-target.js';
export type { DragCollision, DragCollisionOptions, PointerCoordinates } from './collision.js';
export type { Announcement, LiveAnnouncerProps } from './live-announcer.js';
export type { MarkedDraggableAttributes } from './draggable-attributes.js';

export {
  PlaceHolder,
  MatchDroppablePlaceholder,
  DragDroppablePlaceholder,
  ICADroppablePlaceholder,
  DragProvider,
  DraggableChoice,
  swap,
  uid,
  useDraggableControl,
  useDropTarget,
  createDragCollision,
  motionSafeDropAnimation,
  ANNOUNCEMENT_CLEAR_MS,
  LiveAnnouncer,
  nextAnnouncement,
  DRAGGABLE_MARKER,
  draggableAttributes,
};
