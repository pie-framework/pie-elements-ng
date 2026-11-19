import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: 'Selecionada corretamente',
  shouldHaveBeenSelected: 'Deveria ter sido selecionada',
  shouldNotHaveBeenSelected: 'Não deveria ter sido selecionada',
  image: {
    one: 'Imagem com {count} área interativa',
    many: 'Imagem com {count} áreas interativas',
    other: 'Imagem com {count} áreas interativas',
  },
  shape: 'Área interativa {index} de {total}',
} satisfies MessageCatalog;
