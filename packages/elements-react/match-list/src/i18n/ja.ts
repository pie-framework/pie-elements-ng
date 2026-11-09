import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: '選択肢の一覧',
  answerA11y: '解答 {id}',
  responseAreaForA11y: '{prompt}の解答欄',
  responseAreaA11y: '解答欄 {id}',
  dragInstructionsA11y: 'Space キーまたは Enter キーを押すと、この選択肢を持ち上げます。持ち上げたら、Tab キーまたは Shift+Tab キーで解答欄を順に移動するか、矢印キーで自由に動かします。Space キーまたは Enter キーを押すと置き、Esc キーを押すと取り消します。選択肢をクリックして選んでから、解答欄をクリックしてそこに置くこともできます。',
  pickedUpA11y: '{choice}を持ち上げました。Tab キーで解答欄の間を移動し、Space キーまたは Enter キーを押して置きます。',
  notOverResponseAreaA11y: '{choice}は解答欄の上にありません。',
  overFilledA11y: '{target}の上にあります。現在、{choice}が入っています。',
  overEmptyA11y: '{target}の上にあります。現在、空です。',
  returnedA11y: '{choice}を元の位置に戻しました。',
  droppedA11y: '{choice}を{target}に置きました。',
  cancelledA11y: '取り消しました。{choice}を元の位置に戻しました。',
} satisfies MessageCatalog;
