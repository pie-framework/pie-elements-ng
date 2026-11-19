/** The interface strings `@pie-element/image-cloze-association` renders; the source for every other locale. */
export default {
  /** Accessible name of a choice, by its position among the item's choices. */
  answerChoice: 'Answer choice {index} of {total}',
  /** Accessible name of the item image, by its number of response areas. */
  image: {
    one: 'Image with {count} response area',
    other: 'Image with {count} response areas',
  },
  /**
   * Shown when a drop would exceed the per-area limit, by that limit. The warning shows only for a
   * limit above one (a limit of one replaces the placed choice), so `other` is the form learners see.
   */
  reachedLimit: {
    one: 'You’ve reached the limit of {count} response per area. To add another response, one must first be removed.',
    other: 'Full',
  },
  /** Accessible name of a response area without an authored one, by its position. */
  responseArea: 'Response area {index} of {total}',
};
