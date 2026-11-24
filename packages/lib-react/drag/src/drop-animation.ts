import type { DropAnimation } from '@dnd-kit/core';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(REDUCED_MOTION).matches;

/**
 * The `dropAnimation` for a `DragOverlay`: none while the reader's system asks for reduced motion,
 * `animation` otherwise, where `undefined` is dnd-kit's default and `null` is none. dnd-kit plays
 * the drop through the Web Animations API, which no stylesheet can shorten. The preference is read
 * on each render, and the overlay re-renders when a drag starts.
 */
export const motionSafeDropAnimation = (animation?: DropAnimation | null): DropAnimation | null | undefined =>
  prefersReducedMotion() ? null : animation;
