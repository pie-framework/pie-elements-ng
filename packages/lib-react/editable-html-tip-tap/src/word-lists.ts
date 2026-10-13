/**
 * Word for Windows and Mac copies a list as paragraphs, each styled `mso-list:l<list> level<n>`
 * and led by its bullet or number as text in a `mso-list:Ignore` span. `rebuildWordLists` turns
 * them into `<ul>` and `<ol>`, nested by level, with an ordered list's `type` and `start` read from
 * its first number. Word for the web and Google Docs copy lists as lists.
 *
 * Mirrored in `packages/lib-svelte/editable-html-tiptap-svelte/src/word-lists.ts`.
 */

const LIST_STYLE = /mso-list:\s*(l\d+)\s+level(\d+)/i;

// `1.`, `a)`, `(iv)` or `2.1`. Word's bullets are glyphs, and `o`, its second-level bullet, has no
// terminator.
const ORDERED_MARKER = /^\(?(?:\d+(?:\.\d+)*|[a-z]+|[A-Z]+)[.)]$|^\d+(?:\.\d+)+$/;
const ROMAN = /^[ivxlcdm]+$/i;
const ROMAN_VALUES: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };

type ListParagraph = { paragraph: HTMLElement; list: string; level: number };
type OpenList = { level: number; element: HTMLElement; lastItem: HTMLElement | null };

const listParagraphOf = (paragraph: HTMLElement): ListParagraph | null => {
  const match = LIST_STYLE.exec(paragraph.getAttribute('style') ?? '');
  return match ? { paragraph, list: match[1], level: Number(match[2]) } : null;
};

const romanValue = (numeral: string) =>
  Array.from(numeral.toLowerCase()).reduce((total, digit, i, digits) => {
    const value = ROMAN_VALUES[digit];
    return value < (ROMAN_VALUES[digits[i + 1]] ?? 0) ? total - value : total + value;
  }, 0);

// `a` is 1 and `aa` is 27, as a browser counts lower-alpha.
const alphaValue = (letters: string) =>
  Array.from(letters.toLowerCase()).reduce((total, letter) => total * 26 + letter.charCodeAt(0) - 96, 0);

/** The `type` and `start` of an ordered list whose first item Word numbers `marker`. */
function numberingOf(marker: string): { type: string | null; start: number } {
  const label = marker.replace(/^\(|[.)]$/g, '');

  if (/^\d/.test(label)) {
    return { type: null, start: Number(label.split('.').pop()) };
  }
  // A single letter other than `i` counts alphabetically: `c.` is the third item, not the 100th.
  if (ROMAN.test(label) && (label.length > 1 || /^i$/i.test(label))) {
    return { type: label === label.toLowerCase() ? 'i' : 'I', start: romanValue(label) };
  }
  return { type: label === label.toLowerCase() ? 'a' : 'A', start: alphaValue(label) };
}

/** Removes the bullet or number Word leads a list paragraph with, and returns it. */
function takeMarker(paragraph: HTMLElement): string {
  const marker = paragraph.querySelector('span[style*="mso-list:Ignore"]');
  const text = marker?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  marker?.remove();
  return text;
}

function openList(doc: Document, marker: string): HTMLElement {
  if (!ORDERED_MARKER.test(marker)) {
    return doc.createElement('ul');
  }
  const list = doc.createElement('ol');
  const { type, start } = numberingOf(marker);
  if (type) list.setAttribute('type', type);
  if (start !== 1) list.setAttribute('start', String(start));
  return list;
}

/** The list for one run of consecutive list paragraphs of one Word list. */
function buildList(doc: Document, run: ListParagraph[]): DocumentFragment {
  const fragment = doc.createDocumentFragment();
  const open: OpenList[] = [];

  for (const { paragraph, level } of run) {
    const marker = takeMarker(paragraph);
    const ordered = ORDERED_MARKER.test(marker);

    while (open.length && open[open.length - 1].level > level) {
      open.pop();
    }
    let current = open[open.length - 1];

    // A list of the other kind at the same level, as Word allows, starts a list of its own.
    if (current && current.level === level && (current.element.tagName === 'OL') !== ordered) {
      open.pop();
      const parent = open[open.length - 1];
      const element = openList(doc, marker);
      (parent?.lastItem ?? fragment).appendChild(element);
      current = { level, element, lastItem: null };
      open.push(current);
    }
    if (!current || current.level < level) {
      const element = openList(doc, marker);
      (current?.lastItem ?? fragment).appendChild(element);
      current = { level, element, lastItem: null };
      open.push(current);
    }

    const item = doc.createElement('li');
    const content = doc.createElement('p');
    content.append(...Array.from(paragraph.childNodes));
    item.appendChild(content);
    current.element.appendChild(item);
    current.lastItem = item;
  }
  return fragment;
}

const isBlank = (node: Node | null) =>
  node !== null &&
  (node.nodeType === Node.COMMENT_NODE ||
    (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()));

/** Whether `next` follows `previous` with nothing but whitespace or comments between them. */
function follows(previous: HTMLElement, next: HTMLElement) {
  let node = previous.nextSibling;
  while (isBlank(node)) {
    node = node?.nextSibling ?? null;
  }
  return node === next;
}

/** `html` with Word's list paragraphs rebuilt as lists, or `html` itself when it has none. */
export function rebuildWordLists(html: string): string {
  if (!LIST_STYLE.test(html)) {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const paragraphs = Array.from(doc.body.querySelectorAll<HTMLElement>('p'))
    .map(listParagraphOf)
    .filter((paragraph): paragraph is ListParagraph => paragraph !== null);
  const runs: ListParagraph[][] = [];

  for (const paragraph of paragraphs) {
    const run = runs[runs.length - 1];
    const previous = run?.[run.length - 1];

    if (previous && previous.list === paragraph.list && follows(previous.paragraph, paragraph.paragraph)) {
      run.push(paragraph);
    } else {
      runs.push([paragraph]);
    }
  }

  for (const run of runs) {
    const first = run[0].paragraph;
    first.replaceWith(buildList(doc, run));
    for (const { paragraph } of run.slice(1)) {
      paragraph.remove();
    }
  }
  return doc.body.innerHTML;
}
