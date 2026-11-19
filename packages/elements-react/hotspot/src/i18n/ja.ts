import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  correctlySelected: '正しく選択されています',
  shouldHaveBeenSelected: '選択する必要がありました',
  shouldNotHaveBeenSelected: '選択する必要はありませんでした',
  image: {
    other: 'ホットスポットが{count}個ある画像',
  },
  shape: 'ホットスポット {index}/{total}',
} satisfies MessageCatalog;
