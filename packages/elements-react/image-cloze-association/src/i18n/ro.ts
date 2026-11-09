import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: 'Varianta de răspuns {index} din {total}',
  image: {
    one: 'Imagine cu {count} zonă de răspuns',
    few: 'Imagine cu {count} zone de răspuns',
    other: 'Imagine cu {count} de zone de răspuns',
  },
  reachedLimit: {
    one: 'Ai atins limita de {count} răspuns pe zonă. Pentru a adăuga un alt răspuns, trebuie mai întâi să elimini unul.',
    few: 'Plin',
    other: 'Plin',
  },
  responseArea: 'Zona de răspuns {index} din {total}',
} satisfies MessageCatalog;
