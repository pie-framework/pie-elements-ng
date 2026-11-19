import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: 'Choix de réponse {index} sur {total}',
  image: {
    one: 'Image avec {count} zone de réponse',
    many: 'Image avec {count} zones de réponse',
    other: 'Image avec {count} zones de réponse',
  },
  reachedLimit: {
    one: 'Tu as atteint la limite de {count} réponse par zone. Pour ajouter une autre réponse, il faut d’abord en retirer une.',
    many: 'Plein',
    other: 'Plein',
  },
  responseArea: 'Zone de réponse {index} sur {total}',
} satisfies MessageCatalog;
