import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: 'Opção de resposta {index} de {total}',
  image: {
    one: 'Imagem com {count} área de resposta',
    many: 'Imagem com {count} áreas de resposta',
    other: 'Imagem com {count} áreas de resposta',
  },
  reachedLimit: {
    one: 'Você atingiu o limite de {count} resposta por área. Para adicionar outra resposta, é preciso remover uma primeiro.',
    many: 'Cheio',
    other: 'Cheio',
  },
  responseArea: 'Área de resposta {index} de {total}',
} satisfies MessageCatalog;
