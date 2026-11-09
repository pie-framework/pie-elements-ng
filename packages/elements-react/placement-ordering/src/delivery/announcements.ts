// Screen reader announcements for placement ordering with placement areas (a target column).
// The wording is the 'Screen Reader Announcement Final Spec: Ordering with Placement Areas'
// (PIE-835); the row numbers in the comments below are that spec's.

const stripTags = (html: string) =>
  html.replace(/<img\b[^>]*\balt=(["'])(.*?)\1[^>]*>/gi, ' $2 ').replace(/<[^>]*>/g, ' ');

// What a screen reader is told of content that has no text of its own: an image by its alternative text,
// and math by its `alttext`, when it has one.
const readAlternatives = (body: HTMLElement) => {
  body.querySelectorAll('img, math').forEach((node) => {
    const alternative = node.tagName === 'IMG' ? node.getAttribute('alt') : node.getAttribute('alttext');

    node.replaceWith(` ${alternative ?? ''} `);
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

export const getCounts = (tiles: OrderingTile[]): Counts => {
  const targets = tiles.filter((t) => t.type === 'target');
  const sorted = targets.filter((t) => !t.empty).length;
  // The objects in the unsorted column, which is every choice still there: with a choice allowed in
  // more than one position, placing one does not take it out of the column.
  const unsorted = tiles.filter((t) => t.type === 'choice' && !t.empty).length;

  return { sorted, unsorted, total: targets.length };
};

const sortedCount = ({ sorted, total }: Counts) =>
  `${sorted} of ${total} objects on sorted list.`;

// Row 1
export const readingInstructions = (counts: Counts, disabled = false) =>
  `${disabled ? '' : 'Build a sorted list by moving each object to the correct position. Use TAB to move between objects and drop areas, ENTER to select/drop, and ESC to cancel. '}${counts.sorted} of ${counts.total} objects are on the sorted list.`;

// Rows 2 and 5: the column heading, when there is one, then how many objects are in the column.
export const unsortedHeading = (label: string | undefined, counts: Counts) =>
  [toPlainText(label), `${counts.unsorted} unsorted objects`]
    .filter(Boolean)
    .join(' ');

export const sortedHeading = (label: string | undefined, counts: Counts) =>
  [toPlainText(label), `${counts.sorted} sorted objects`]
    .filter(Boolean)
    .join(' ');

// Rows 3, 4, 6 and 7
export const unsortedObjectPrefix = () => 'object:';
export const endOfUnsorted = () => 'End of unsorted objects';
export const sortedObjectPrefix = (index: number) =>
  `Sort position ${index + 1}:`;
export const endOfSorted = (disabled = false) =>
  disabled ? 'End of sorted objects.' : 'End of sorted objects. Use TAB to move to an object.';

/**
 * What an object, or an empty sort position, announces when it gets focus (rows 8, 9, 12 and 13),
 * given the object that is selected, if any. `tile` is a tile of the ordering; `selected` is the drag
 * data of the selected tile. A disabled item's tiles have no role to carry a label, so they are read as their text.
 */
export const focusLabel = (
  tile: { type: string; id?: string; index?: number; label?: string; empty?: boolean; disabled?: boolean },
  selected: { type: string; id?: string; index?: number; value?: string } | null | undefined,
  counts: Counts,
): string | undefined => {
  const text = toPlainText(tile.label);
  const selectedText = toPlainText(selected?.value);
  const isSelected = !!selected && selected.type === tile.type && selected.id === tile.id && selected.index === tile.index;

  if (tile.type === 'target') {
    const position = (tile.index ?? 0) + 1;

    // A disabled tile has no role to carry a label, so it is read as its text, after the prefix before it
    if (tile.disabled) return undefined;

    if (!selected) {
      // Row 9
      return tile.empty
        ? undefined
        : `Sorted object ${text} In position ${position} of ${counts.total}. Press ENTER to select or TAB to move to a different object`;
    }

    // The selected object itself: where it is, as when it was picked up (row 11)
    if (isSelected) return selectedMessage(selected, counts);

    // Row 12
    if (tile.empty) {
      return `On sort position ${position} of ${counts.total}, which is empty. Press ENTER to move selected object ${selectedText} here or use TAB to move to a different position.`;
    }

    // Row 13
    return `On sort position ${position} of ${counts.total}, which contains object ${text}. Use TAB to move to a different position or press ENTER to move the selected object ${selectedText} here, which will return the object currently in sort position ${position} to unsorted.`;
  }

  if (tile.type === 'choice') {
    if (tile.disabled) return undefined;

    // Rows 14 and 15: the unsorted list, as the selected object's own place in it
    if (selected && (isSelected || (tile.empty && tile.id === selected.id))) {
      return selected.type === 'target'
        ? `On unsorted list. Press ENTER to return selected object ${selectedText} to unsorted or use TAB to move to a sort position.`
        : `On unsorted list. Press ENTER to leave object ${selectedText} unsorted or use TAB to move to a sort position.`;
    }

    // Row 8: the gap an object left in the unsorted list has no object to name
    return tile.empty ? undefined : `Unsorted object ${text} Press ENTER to select or TAB to move to a different object.`;
  }

  return undefined;
};

// Rows 10 and 11: an object was selected.
export const selectedMessage = (
  selected: { type: string; index?: number; value?: string },
  counts: Counts,
) => {
  const text = toPlainText(selected.value);

  return selected.type === 'target'
    ? `Selected object ${text}, which is in sort position ${(selected.index ?? 0) + 1} of ${counts.total}. Use TAB to move to a different position.`
    : `Selected object ${text} Use TAB to move to a sorted position.`;
};

type Placement = { type: string; index?: number; value?: string };

/**
 * What the student hears once an object has been dropped, from the answer as it was before the drop
 * (`tiles`) and the drag data of the object and of what it was dropped on. Rows 16 to 20; nothing for
 * a drop that changes nothing.
 */
export const movedMessage = (
  tiles: OrderingTile[],
  from: Placement,
  to: Placement,
): string | undefined => {
  const counts = getCounts(tiles);
  const text = toPlainText(from.value);
  const occupant =
    to.type === 'target'
      ? tiles.find((t) => t.type === 'target' && t.index === to.index)
      : undefined;
  const displaced =
    occupant && !occupant.empty ? toPlainText(occupant.label) : undefined;

  if (from.type === 'choice' && to.type === 'target') {
    const position = `sort position ${(to.index ?? 0) + 1} of ${counts.total}`;

    if (displaced === undefined) {
      // Row 16
      const sorted = counts.sorted + 1;

      return sorted === counts.total
        ? `Placed object ${text} in ${position}. Answer is complete. ${counts.total} of ${counts.total} objects on sorted list.`
        : `Placed object ${text} in ${position}. ${sorted} of ${counts.total} objects on sorted list. Use TAB to move to another object.`;
    }

    // Row 17
    return `Placed object ${text} in ${position}. Object ${displaced} has been returned to unsorted list. ${sortedCount(counts)} Use TAB to move to another object.`;
  }

  if (from.type === 'target' && to.type === 'target') {
    if (from.index === to.index) return undefined;

    const route = `from sort position ${(from.index ?? 0) + 1} to sort position ${(to.index ?? 0) + 1}`;

    if (displaced === undefined) {
      // Row 18
      return `Moved object ${text} ${route}. ${sortedCount(counts)} Use TAB to move to another object.`;
    }

    // Row 19
    return `Moved object ${text} ${route}. Object ${displaced} has been returned to unsorted list. ${sortedCount({ ...counts, sorted: counts.sorted - 1 })} Use TAB to move to another object.`;
  }

  if (from.type === 'target' && to.type === 'choice') {
    // Row 20
    return `Removed object ${text} from sort position ${(from.index ?? 0) + 1}. ${sortedCount({ ...counts, sorted: counts.sorted - 1 })} Use TAB to move to another object.`;
  }

  return undefined;
};

// Row 21: the selection was cancelled, or ended where it started.
export const cancelledMessage = (
  selected: { value?: string },
  counts: Counts,
) =>
  `Object ${toPlainText(selected.value)} is no longer selected. ${sortedCount(counts)} Use TAB to move to another object.`;
