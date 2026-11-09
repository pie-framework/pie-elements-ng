import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: 'Answer choice {index} of {total}',
  image: {
    one: 'Image with {count} response area',
    other: 'Image with {count} response areas',
  },
  reachedLimit: {
    one: 'You’ve reached the limit of {count} response per area. To add another response, one must first be removed.',
    other: 'Full',
  },
  responseArea: 'Response area {index} of {total}',
} satisfies MessageCatalog;
