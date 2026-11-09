import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: 'Svarsalternativ {index} av {total}',
  image: {
    one: 'Bild med {count} svarsområde',
    other: 'Bild med {count} svarsområden',
  },
  reachedLimit: {
    one: 'Du har nått gränsen på {count} svar per område. Om du vill lägga till ett svar måste du först ta bort ett.',
    other: 'Fullt',
  },
  responseArea: 'Svarsområde {index} av {total}',
} satisfies MessageCatalog;
