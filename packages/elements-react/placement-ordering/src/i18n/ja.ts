import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  dragInstructions: 'この解答の選択肢を持ち上げるには、SpaceキーかEnterキーを押してください。持ち上げた後は、TabキーかShift+Tabキーで解答エリアを順に移動するか、矢印キーで自由に動かせます。置くにはSpaceキーかEnterキーを、取り消すにはEscキーを押してください。',
  commonCorrectAnswerWithAlternates: '注：上に表示されている解答は、この問題で最も一般的な正解です。ほかにも1つ以上の正解が設定されており、それらも正解として認められます。',
  readingInstructions: '各オブジェクトを正しい位置に移動して、並べ替えたリストを作成してください。Tabキーでオブジェクトとドロップエリアの間を移動し、Enterキーで選択または配置し、Escキーで取り消します。',
  objectsAreOnSortedList: {
    other: '{total}個のオブジェクトのうち{sorted}個が並べ替えたリストにあります。',
  },
  unsortedObjects: {
    other: '並べ替え前のオブジェクト {count}個',
  },
  sortedObjects: {
    other: '並べ替え済みのオブジェクト {count}個',
  },
  unsortedObjectPrefix: 'オブジェクト:',
  sortedObjectPrefix: '位置 {position}:',
  endOfUnsorted: '並べ替え前のオブジェクトの終わり',
  endOfSorted: '並べ替え済みのオブジェクトの終わり。',
  useTabToObject: 'Tabキーでオブジェクトに移動します。',
  unsortedObjectFocus: '並べ替え前のオブジェクト {text} Enterキーで選択、Tabキーで別のオブジェクトに移動します。',
  sortedObjectFocus: '並べ替え済みのオブジェクト {text} {total}個中{position}番目の位置。Enterキーで選択、Tabキーで別のオブジェクトに移動します',
  emptyPositionFocus: '{total}個中{position}番目の位置で、空です。Enterキーで選択中のオブジェクト {text} をここに移動するか、Tabキーで別の位置に移動します。',
  occupiedPositionFocus: '{total}個中{position}番目の位置で、オブジェクト {occupant} が入っています。Tabキーで別の位置に移動するか、Enterキーで選択中のオブジェクト {text} をここに移動します。現在{position}番目の位置にあるオブジェクトは、並べ替え前のリストに戻ります。',
  unsortedListReturnFocus: '並べ替え前のリストです。Enterキーで選択中のオブジェクト {text} を並べ替え前のリストに戻すか、Tabキーで位置に移動します。',
  unsortedListLeaveFocus: '並べ替え前のリストです。Enterキーでオブジェクト {text} を並べ替え前のままにするか、Tabキーで位置に移動します。',
  selectedUnsorted: '選択中のオブジェクト {text} Tabキーで並べ替え済みのリストの位置に移動します。',
  selectedSorted: '選択中のオブジェクト {text}、{total}個中{position}番目の位置にあります。Tabキーで別の位置に移動します。',
  placed: 'オブジェクト {text} を{total}個中{position}番目の位置に配置しました。',
  moved: 'オブジェクト {text} を{from}番目の位置から{to}番目の位置に移動しました。',
  removed: 'オブジェクト {text} を{position}番目の位置から外しました。',
  returnedToUnsorted: 'オブジェクト {text} は並べ替え前のリストに戻りました。',
  answerComplete: {
    other: '解答が完了しました。{total}個のオブジェクトのうち{total}個が並べ替えたリストにあります。',
  },
  objectsOnSortedList: {
    other: '{total}個のオブジェクトのうち{sorted}個が並べ替えたリストにあります。',
  },
  useTabToAnotherObject: 'Tabキーで別のオブジェクトに移動します。',
  noLongerSelected: 'オブジェクト {text} の選択が解除されました。',
} satisfies MessageCatalog;
