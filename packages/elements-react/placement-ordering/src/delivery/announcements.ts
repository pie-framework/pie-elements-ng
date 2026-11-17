import type { NestedKeys, Translator } from '@pie-element/shared-i18n';
import type enUS from '../i18n/en-US.js';

// Screen reader announcements for placement ordering with placement areas (a target column).
// The wording is the 'Screen Reader Announcement Final Spec: Ordering with Placement Areas'
// (PIE-835); the row numbers in the comments below are that spec's.

// The tokens of MathML that carry its text; an annotation holds a source form of the same math.
const MATH_TOKENS = 'mi, mn, mo, mtext, ms';

const stripTags = (html: string) =>
  html
    .replace(/<img\b[^>]*\balt=(["'])(.*?)\1[^>]*>/gi, ' $2 ')
    // math with an alternative text is read as it, without a reading of its tokens
    .replace(/<math\b[^>]*\balttext=(["'])(.+?)\1[^>]*>.*?<\/math>/gis, ' $2 ')
    // an annotation holds a source form of the math, which is not read
    .replace(/<annotation(-xml)?\b[^>]*>.*?<\/annotation\1>/gis, ' ')
    .replace(/<[^>]*>/g, ' ');

// The text of the tokens of some math, apart so that `<mn>1</mn><mn>2</mn>` does not read as twelve.
const mathText = (math: Element) =>
  [...math.querySelectorAll(MATH_TOKENS)]
    .filter((token) => !token.closest('annotation, annotation-xml'))
    .map((token) => token.textContent)
    .join(' ');

// What a screen reader is told of content that has no text of its own: an image by its alternative text,
// and math by its `alttext`, or by its tokens when it has none or an empty one. An image with an empty
// `alt` is decorative and reads as nothing.
const readAlternatives = (body: HTMLElement) => {
  body.querySelectorAll('img, math').forEach((node) => {
    const alternative =
      node.tagName === 'IMG'
        ? (node.getAttribute('alt') ?? '')
        : node.getAttribute('alttext') || mathText(node) || node.textContent || '';

    node.replaceWith(` ${alternative} `);
  });
};

const plainTextCache = new Map<string, string>();
const PLAIN_TEXT_CACHE_SIZE = 500;

/**
 * A choice label as plain text. Labels are model HTML, so they are parsed into an inert document
 * (nothing in it loads or runs) rather than set on a live element. A label is parsed once: the same
 * labels are read again on every render.
 */
export const toPlainText = (html?: string | null): string => {
  if (!html) return '';

  const cached = plainTextCache.get(html);
  if (cached !== undefined) return cached;

  let raw: string;

  if (typeof DOMParser !== 'undefined') {
    const { body } = new DOMParser().parseFromString(html, 'text/html');

    readAlternatives(body);
    raw = body.textContent ?? '';
  } else {
    raw = stripTags(html);
  }

  const text = raw.replace(/\s+/g, ' ').trim();

  if (plainTextCache.size >= PLAIN_TEXT_CACHE_SIZE) plainTextCache.clear();
  plainTextCache.set(html, text);

  return text;
};

type OrderingTile = {
  type: string;
  index?: number;
  id?: string;
  label?: string;
  empty?: boolean;
};

/** What the announcements need to know of the answer: the sort positions and what is in them. */
export type Counts = { sorted: number; unsorted: number; total: number };

/** The package's translator, fixed to the item's language. */
export type I18n = Translator<NestedKeys<typeof enUS>>;

export const getCounts = (tiles: OrderingTile[]): Counts => {
  const targets = tiles.filter((t) => t.type === 'target');
  const sorted = targets.filter((t) => !t.empty).length;
  // The objects in the unsorted column, which is every choice still there: with a choice allowed in
  // more than one position, placing one does not take it out of the column.
  const unsorted = tiles.filter((t) => t.type === 'choice' && !t.empty).length;

  return { sorted, unsorted, total: targets.length };
};

// Sentences are joined by a space, in the order the spec reads them.
const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' ');

const objectsOnSortedList = (i18n: I18n, { sorted, total }: Counts) =>
  i18n.plural('objectsOnSortedList', { count: total, sorted, total });

// Row 1
export const readingInstructions = (i18n: I18n, counts: Counts, disabled = false) =>
  join(
    disabled ? undefined : i18n.t('readingInstructions'),
    i18n.plural('objectsAreOnSortedList', { count: counts.total, sorted: counts.sorted, total: counts.total }),
  );

// Rows 2 and 5: the column heading, when there is one, then how many objects are in the column.
export const unsortedHeading = (i18n: I18n, label: string | undefined, counts: Counts) =>
  join(toPlainText(label), i18n.plural('unsortedObjects', { count: counts.unsorted }));

export const sortedHeading = (i18n: I18n, label: string | undefined, counts: Counts) =>
  join(toPlainText(label), i18n.plural('sortedObjects', { count: counts.sorted }));

// Rows 3, 4, 6 and 7
export const unsortedObjectPrefix = (i18n: I18n) => i18n.t('unsortedObjectPrefix');
export const endOfUnsorted = (i18n: I18n) => i18n.t('endOfUnsorted');
export const sortedObjectPrefix = (i18n: I18n, index: number) =>
  i18n.t('sortedObjectPrefix', { position: index + 1 });
export const endOfSorted = (i18n: I18n, disabled = false) =>
  join(i18n.t('endOfSorted'), disabled ? undefined : i18n.t('useTabToObject'));

type Selected = { type: string; id?: string; index?: number; value?: string };

/**
 * What an object, or an empty sort position, announces when it gets focus (rows 8, 9, 12 and 13),
 * given the object that is selected, if any. `tile` is a tile of the ordering; `selected` is the drag
 * data of the selected tile. A disabled item's tiles have no role to carry a label, so they are read as
 * their text.
 */
export const focusLabel = (
  i18n: I18n,
  tile: { type: string; id?: string; index?: number; label?: string; empty?: boolean; disabled?: boolean },
  selected: Selected | null | undefined,
  counts: Counts,
): string | undefined => {
  if (tile.disabled) return undefined;

  const text = toPlainText(tile.label);
  const selectedText = toPlainText(selected?.value);
  const isSelected =
    !!selected && selected.type === tile.type && selected.id === tile.id && selected.index === tile.index;

  if (tile.type === 'target') {
    const position = (tile.index ?? 0) + 1;

    if (!selected) {
      // Row 9
      return tile.empty ? undefined : i18n.t('sortedObjectFocus', { text, position, total: counts.total });
    }

    // The selected object itself: where it is, as when it was picked up (row 11)
    if (isSelected) return selectedMessage(i18n, selected, counts);

    // Row 12
    if (tile.empty) {
      return i18n.t('emptyPositionFocus', { text: selectedText, position, total: counts.total });
    }

    // Row 13
    return i18n.t('occupiedPositionFocus', { text: selectedText, occupant: text, position, total: counts.total });
  }

  if (tile.type === 'choice') {
    // Rows 14 and 15: the unsorted list, as the selected object's own place in it
    if (selected && (isSelected || (tile.empty && tile.id === selected.id))) {
      return i18n.t(selected.type === 'target' ? 'unsortedListReturnFocus' : 'unsortedListLeaveFocus', {
        text: selectedText,
      });
    }

    // Row 8: the gap an object left in the unsorted list has no object to name
    return tile.empty ? undefined : i18n.t('unsortedObjectFocus', { text });
  }

  return undefined;
};

// Rows 10 and 11: an object was selected.
export const selectedMessage = (i18n: I18n, selected: Selected, counts: Counts) => {
  const text = toPlainText(selected.value);

  return selected.type === 'target'
    ? i18n.t('selectedSorted', { text, position: (selected.index ?? 0) + 1, total: counts.total })
    : i18n.t('selectedUnsorted', { text });
};

type Placement = { type: string; index?: number; value?: string };

/**
 * What the student hears once an object has been dropped, from the answer as it was before the drop
 * (`tiles`) and the drag data of the object and of what it was dropped on. Rows 16 to 20; nothing for
 * a drop that changes nothing.
 */
export const movedMessage = (i18n: I18n, tiles: OrderingTile[], from: Placement, to: Placement): string | undefined => {
  const counts = getCounts(tiles);
  const text = toPlainText(from.value);
  const occupant = to.type === 'target' ? tiles.find((t) => t.type === 'target' && t.index === to.index) : undefined;
  const displaced = occupant && !occupant.empty ? toPlainText(occupant.label) : undefined;
  const without = { ...counts, sorted: counts.sorted - 1 };

  if (from.type === 'choice' && to.type === 'target') {
    const placed = i18n.t('placed', { text, position: (to.index ?? 0) + 1, total: counts.total });

    if (displaced === undefined) {
      // Row 16
      return counts.sorted + 1 === counts.total
        ? join(placed, i18n.plural('answerComplete', { count: counts.total, total: counts.total }))
        : join(
            placed,
            objectsOnSortedList(i18n, { ...counts, sorted: counts.sorted + 1 }),
            i18n.t('useTabToAnotherObject'),
          );
    }

    // Row 17
    return join(
      placed,
      i18n.t('returnedToUnsorted', { text: displaced }),
      objectsOnSortedList(i18n, counts),
      i18n.t('useTabToAnotherObject'),
    );
  }

  if (from.type === 'target' && to.type === 'target') {
    if (from.index === to.index) return undefined;

    const moved = i18n.t('moved', { text, from: (from.index ?? 0) + 1, to: (to.index ?? 0) + 1 });

    if (displaced === undefined) {
      // Row 18
      return join(moved, objectsOnSortedList(i18n, counts), i18n.t('useTabToAnotherObject'));
    }

    // Row 19
    return join(
      moved,
      i18n.t('returnedToUnsorted', { text: displaced }),
      objectsOnSortedList(i18n, without),
      i18n.t('useTabToAnotherObject'),
    );
  }

  if (from.type === 'target' && to.type === 'choice') {
    // Row 20
    return join(
      i18n.t('removed', { text, position: (from.index ?? 0) + 1 }),
      objectsOnSortedList(i18n, without),
      i18n.t('useTabToAnotherObject'),
    );
  }

  return undefined;
};

// Row 21: the selection was cancelled, or ended where it started.
export const cancelledMessage = (i18n: I18n, selected: { value?: string }, counts: Counts) =>
  join(
    i18n.t('noLongerSelected', { text: toPlainText(selected.value) }),
    objectsOnSortedList(i18n, counts),
    i18n.t('useTabToAnotherObject'),
  );

// A button moved an object one position, in an item without response areas.
export const movedInPlaceMessage = (i18n: I18n, text: string, position: number, total: number) =>
  i18n.t('movedToPosition', { text: toPlainText(text), position, total });

// What a button that moves an object one position toward the start (`earlier`) or the end is named.
export const moveButtonLabel = (i18n: I18n, text: string, vertical: boolean, earlier: boolean) =>
  i18n.t(vertical ? (earlier ? 'moveUp' : 'moveDown') : earlier ? 'moveLeft' : 'moveRight', {
    text: toPlainText(text),
  });
