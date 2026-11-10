import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: 'Aviso',
  limitMaxChoicesPerCategory: 'Você atingiu o limite de {maxChoicesPerCategory} respostas por área. Para adicionar outra resposta, é preciso remover uma primeiro.',
  cancel: 'Cancelar',
  commonCorrectAnswerWithAlternates: 'Observação: a resposta mostrada acima é a resposta correta mais comum para esta questão. Uma ou mais respostas corretas adicionais também estão definidas e também serão reconhecidas como corretas.',
  maxChoicesPerCategoryRestriction: 'Para alterar este valor para {maxChoicesPerCategory}, o número de opções de resposta em cada categoria não pode ser maior que {maxChoicesPerCategory}.',
} satisfies MessageCatalog;
