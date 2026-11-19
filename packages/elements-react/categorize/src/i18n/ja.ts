import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: '警告',
  limitMaxChoicesPerCategory: '1つのエリアに入れられる解答は{maxChoicesPerCategory}個までです。別の解答を入れるには、先に1つ取り除いてください。',
  cancel: 'キャンセル',
  commonCorrectAnswerWithAlternates: '注：上に表示されている解答は、この問題で最も一般的な正解です。ほかにも1つ以上の正解が設定されており、それらも正解として認められます。',
  maxChoicesPerCategoryRestriction: 'この値を{maxChoicesPerCategory}に変更するには、各カテゴリーの解答の選択肢を{maxChoicesPerCategory}個以下にする必要があります。',
} satisfies MessageCatalog;
