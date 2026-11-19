/** The side of a line a sequential move goes toward: where text starts, or where it ends. */
export type InlineSide = 'inline-start' | 'inline-end';

/** Whether `element`'s text runs right to left, from its computed direction. */
export function isRightToLeft(element: Element | null | undefined): boolean {
  const view = element?.ownerDocument?.defaultView;
  return Boolean(element && view && view.getComputedStyle(element).direction === 'rtl');
}

/**
 * The inline side a horizontal arrow key moves toward in `element`'s text: ArrowLeft is the inline
 * start in left-to-right text and the inline end in right-to-left text. The direction is read when
 * the key is pressed, so a block with its own `dir` answers for itself. Every other key has none.
 *
 * Sequential navigation (previous and next) goes through this; spatial movement keeps the physical
 * key.
 */
export function inlineSideOfArrow(
  key: string,
  element: Element | null | undefined
): InlineSide | undefined {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return undefined;
  return (key === 'ArrowLeft') !== isRightToLeft(element) ? 'inline-start' : 'inline-end';
}
