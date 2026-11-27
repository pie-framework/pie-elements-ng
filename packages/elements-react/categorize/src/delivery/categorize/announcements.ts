// The screen-reader wording for categorize, built from the model and the learner's answers alone so the
// delivery components stay free of it. Row numbers refer to the spec's table (PIE-1003).

import type { catalogs } from '../../i18n/index.js';

type I18n = ReturnType<typeof catalogs.forLocale>;

export interface Category {
  id: string;
  label?: string;
}

/** A choice, in the pool or in a category (`categoryId` is set when it is placed). */
export interface Choice {
  id: string;
  /** The choice's HTML content. */
  value: string;
  categoryId?: string;
}

export interface Config {
  categories: Category[];
  rowLabels: string[];
  categoriesPerRow: number;
  /** 0 when a category holds any number. */
  maxChoicesPerCategory: number;
  /** The model's choices, which fix each one's position. */
  choices: Array<{ id: string; content: string; categoryCount?: number }>;
  /** Whether the row labels are shown, which makes the categories a matrix. */
  matrix: boolean;
}

export interface Answer {
  category: string;
  choices?: string[];
}

// The same test the categories grid applies before it shows its row-label column.
const hasNonEmptyString = (labels: unknown[]) =>
  labels.some((label) => typeof label === 'string' && label.trim() !== '' && label.trim() !== '<div></div>');

/** The slice of the model the announcements are built from. */
export const buildConfig = (model: {
  categories?: Category[];
  rowLabels?: string[];
  categoriesPerRow?: number;
  maxChoicesPerCategory?: number;
  choices?: Array<{ id: string; content: string; categoryCount?: number }>;
}): Config => {
  const categories = model.categories ?? [];
  const categoriesPerRow = Math.max(model.categoriesPerRow || 1, 1);
  const rows = Math.ceil(categories.length / categoriesPerRow);
  const rowLabels = (model.rowLabels ?? []).slice(0, rows);

  return {
    categories,
    rowLabels,
    categoriesPerRow,
    maxChoicesPerCategory: model.maxChoicesPerCategory ?? 0,
    choices: model.choices ?? [],
    matrix: categories.length > 0 && hasNonEmptyString(rowLabels),
  };
};

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

// Fallback for where there is no DOM (server rendering): named and numeric entities, in one pass.
const decode = (text: string) =>
  text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (entity, dec, hex, name) => {
    const code = dec ? Number(dec) : hex ? parseInt(hex, 16) : undefined;

    return code !== undefined ? String.fromCodePoint(code) : (ENTITIES[name.toLowerCase()] ?? entity);
  });

// MathML as it is said: a fraction as "numerator over denominator", anything else as its tokens in order.
const speakMath = (i18n: I18n, node: Node): string => {
  if (node.nodeType === 3) {
    return node.textContent ?? '';
  }

  const el = node as Element;
  const tag = el.localName;

  // An annotation holds a source form of the same math, which is not read.
  if (tag === 'annotation' || tag === 'annotation-xml') {
    return '';
  }

  const kids = Array.from(el.children);

  if (tag === 'mfrac' && kids.length >= 2) {
    return i18n.t('mathFractionA11y', {
      numerator: speakMath(i18n, kids[0]).trim(),
      denominator: speakMath(i18n, kids[1]).trim(),
    });
  }

  return kids.length === 0 ? (el.textContent ?? '') : kids.map((kid) => speakMath(i18n, kid)).join(' ');
};

const textOf = (html: string, i18n?: I18n) => {
  if (typeof DOMParser === 'undefined') {
    return decode(html.replace(/<[^>]*>/g, ' '));
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  if (i18n) {
    doc.body.querySelectorAll('math').forEach((math) => {
      math.replaceWith(` ${math.getAttribute('alttext')?.trim() || speakMath(i18n, math)} `);
    });
  }

  // Block boundaries read as spaces, so "<p>a</p><p>b</p>" is "a b", not "ab".
  doc.body.querySelectorAll('p, div, br, li, tr').forEach((el) => el.append(' '));

  return doc.body.textContent ?? '';
};

/** The text of an HTML label: its words, else the alt text of its image. */
export const plainText = (html: string | undefined | null, i18n?: I18n) => {
  if (!html) {
    return '';
  }

  const text = textOf(html, i18n).replace(/\s+/g, ' ').trim();

  return text || (/<img\b[^>]*\balt\s*=\s*["']([^"']*)["']/i.exec(html)?.[1] ?? '').trim();
};

// Math in LaTeX and media that stripping the tags would read wrongly, or not at all. MathML is read by `speakMath`.
const RICH_CONTENT = /data-latex|\\\(|\\\[|\$\$|<mjx|<svg\b|<audio\b|<video\b|<object\b|<embed\b|<iframe\b/i;

export const hasRichContent = (html: string | undefined | null) => !!html && RICH_CONTENT.test(html);

/** What the learner hears for some label: its text, else its position among its siblings. */
const spoken = (i18n: I18n, html: string | undefined | null, index: number) =>
  (hasRichContent(html) ? '' : plainText(html, i18n)) || i18n.t('unnamedA11y', { index: index + 1 });

/** What the learner hears for a choice: its text, else its position among the model's choices. */
export const choiceText = (i18n: I18n, config: Config, choice: { id: string; value: string }) =>
  spoken(
    i18n,
    choice.value,
    config.choices.findIndex((c) => c.id === choice.id),
  );

const contentOf = (config: Config, id: string) => config.choices.find((c) => c.id === id)?.content ?? '';

const categoryIndex = (config: Config, id: string | undefined) =>
  Math.max(
    config.categories.findIndex((c) => c.id === id),
    0,
  );

// A column is named by its heading, the label of the category in the first row, which the cells below it share.
const columnLabel = (i18n: I18n, config: Config, index: number) => {
  const column = index % config.categoriesPerRow;

  return spoken(i18n, config.categories[column]?.label, column);
};

const rowLabel = (i18n: I18n, config: Config, row: number) => spoken(i18n, config.rowLabels[row], row);

/** "category [label]", or "category in row [row label] and column [column label]" in a matrix. */
export const describeCategory = (i18n: I18n, config: Config, id: string | undefined) => {
  const index = categoryIndex(config, id);

  return config.matrix
    ? i18n.t('categoryInMatrixA11y', {
        row: rowLabel(i18n, config, Math.floor(index / config.categoriesPerRow)),
        column: columnLabel(i18n, config, index),
      })
    : i18n.t('categoryNamedA11y', { label: spoken(i18n, config.categories[index]?.label, index) });
};

/** Row 3's subject of a category: "Category 1 [label]" (several choices) or "Category [label]" in a list. */
const categorySubject = (i18n: I18n, config: Config, id: string, indexed: boolean) => {
  const index = categoryIndex(config, id);

  if (config.matrix) {
    return i18n.t('categorySubjectMatrixA11y', {
      row: rowLabel(i18n, config, Math.floor(index / config.categoriesPerRow)),
      column: columnLabel(i18n, config, index),
    });
  }

  const label = spoken(i18n, config.categories[index]?.label, index);

  return indexed
    ? i18n.t('categorySubjectIndexedA11y', { index: index + 1, label })
    : i18n.t('categorySubjectA11y', { label });
};

// Whether a number is said with a vowel sound, so English puts "an" before it: eight, eleven and eighteen.
const startsWithVowelSound = (n: number) => /^(8\d*|11|18)$/.test(String(n));

const holdsMany = (config: Config) => config.maxChoicesPerCategory !== 1;

/** Whether every choice can be placed more than once. */
export const isReusable = (config: Config) =>
  config.choices.length > 0 && config.choices.every((c) => c.categoryCount !== 1);

/** Row 1: the structure, in one paragraph each for the categories, the labels and the choices. */
const describeStructure = (i18n: I18n, config: Config): string[] => {
  const count = config.categories.length;
  const capacity = config.maxChoicesPerCategory;
  const reuse = isReusable(config) ? 'introChoicesReusableA11y' : 'introChoicesNotReusableA11y';
  const choices = i18n.plural(reuse, { count: config.choices.length });

  if (!config.matrix) {
    const one = count === 1;
    const structure =
      capacity === 0
        ? one
          ? i18n.t('introOneCategoryUnlimitedA11y')
          : i18n.t('introCategoriesUnlimitedA11y', { count })
        : capacity === 1
          ? one
            ? i18n.t('introOneCategoryOneA11y')
            : i18n.t('introCategoriesOneA11y', { count })
          : one
            ? i18n.t('introOneCategoryManyA11y', { capacity })
            : i18n.t('introCategoriesManyA11y', { count, capacity });

    return [`${structure} ${choices}`];
  }

  const columns = Math.min(config.categoriesPerRow, count);
  const rows = Math.ceil(count / config.categoriesPerRow);
  const each =
    capacity === 0
      ? i18n.t('matrixCapacityUnlimitedA11y')
      : capacity === 1
        ? i18n.t('matrixCapacityOneA11y')
        : i18n.t('matrixCapacityManyA11y', { capacity });

  return [
    `${i18n.t(startsWithVowelSound(columns) ? 'introMatrixAnA11y' : 'introMatrixA11y', { count, columns, rows })} ${each}`,
    [
      i18n.t('columnLabelsA11y'),
      ...Array.from({ length: columns }, (_, c) =>
        i18n.t('columnA11y', { index: c + 1, label: columnLabel(i18n, config, c) }),
      ),
    ].join(' '),
    [
      i18n.t('rowLabelsA11y'),
      ...Array.from({ length: rows }, (_, r) =>
        i18n.t('rowA11y', { index: r + 1, label: rowLabel(i18n, config, r) }),
      ),
    ].join(' '),
    choices,
  ];
};

/** Row 3: each category and the answer choices it holds, one paragraph each. */
const describeCategories = (i18n: I18n, config: Config, answers: Answer[]): string[] =>
  config.categories.map((category) => {
    const placed = answers.find((a) => a.category === category.id)?.choices ?? [];
    const choice = (id: string) => choiceText(i18n, config, { id, value: contentOf(config, id) });

    if (holdsMany(config)) {
      const subject = categorySubject(i18n, config, category.id, true);

      return [
        i18n.plural('categoryContainsA11y', { subject, count: placed.length }),
        // In a matrix a cell that holds one is read as the count and the choice; the "answer choice" lead-in
        // comes only with several.
        ...placed.map((id) =>
          config.matrix && placed.length === 1 ? choice(id) : i18n.t('categoryChoiceA11y', { choice: choice(id) }),
        ),
        ...(placed.length > 1 ? [i18n.t('categoryEndA11y')] : []),
      ].join(' ');
    }

    const subject = categorySubject(i18n, config, category.id, false);

    return placed.length === 0
      ? i18n.t('categoryEmptyA11y', { subject })
      : i18n.t('categoryHoldsA11y', { subject, choice: choice(placed[0]) });
  });

/** Rows 1 to 4 of the intro, one paragraph each, read after the prompt. */
export const describeIntro = (
  i18n: I18n,
  config: Config,
  answers: Answer[],
  available: Array<{ id: string; content: string }>,
): string[] => [
  ...describeStructure(i18n, config),
  i18n.t('keyboardHelpA11y'),
  ...describeCategories(i18n, config, answers),
  describeAvailable(i18n, config, available),
];

/** Row 4: the choices still in the pool, in the order they are read. */
export const describeAvailable = (
  i18n: I18n,
  config: Config,
  available: Array<{ id: string; content: string }>,
) => {
  const header = i18n.plural('availableA11y', { count: available.length });

  if (available.length === 0) {
    return header;
  }

  return [
    header,
    ...available.map((a) =>
      i18n.t('availableChoiceA11y', { choice: choiceText(i18n, config, { id: a.id, value: a.content }) }),
    ),
    i18n.t('availableEndA11y'),
    i18n.t('tabToChoicesA11y'),
  ].join(' ');
};

/** Rows 5 and 6: the name of a choice tile, in the pool or in a category. */
export const describeChoiceTile = (i18n: I18n, config: Config, choice: Choice) => {
  const text = choiceText(i18n, config, choice);

  return choice.categoryId === undefined
    ? i18n.t('answerChoiceA11y', { choice: text })
    : i18n.t('answerChoiceInCategoryA11y', { choice: text, category: describeCategory(i18n, config, choice.categoryId) });
};

/** Row 7: a choice was selected. */
export const describeSelection = (i18n: I18n, config: Config, choice: Choice) =>
  i18n.t('selectedA11y', { choice: choiceText(i18n, config, choice) });

/** Rows 8 and 15: the selection ended without moving anything. */
export const describeDeselection = (i18n: I18n, config: Config, choice: Choice) =>
  i18n.t('deselectedA11y', { choice: choiceText(i18n, config, choice) });

/** Rows 9 to 11: the drop target that has focus while a choice is selected. `target` is undefined for the pool. */
export const describeFocusTarget = (i18n: I18n, config: Config, selected: Choice, target: string | undefined) => {
  const choice = choiceText(i18n, config, selected);

  if (target !== undefined) {
    return i18n.t('overCategoryA11y', { category: describeCategory(i18n, config, target), choice });
  }

  return selected.categoryId !== undefined
    ? i18n.t('overPoolFromCategoryA11y', { category: describeCategory(i18n, config, selected.categoryId), choice })
    : i18n.t('overPoolUnplacedA11y', { choice });
};

/**
 * Rows 12 to 15: what dropping `selected` on a category (`target`) or the pool (undefined) just did,
 * read against the answers as they are *before* the drop, which the component then applies.
 */
export const describePlacementResult = (
  i18n: I18n,
  config: Config,
  answers: Answer[],
  selected: Choice,
  target: string | undefined,
) => {
  const choice = choiceText(i18n, config, selected);
  const from = selected.categoryId;

  // Nothing moves: dropped back where it was, or on the pool from the pool.
  if (from === target) {
    return describeDeselection(i18n, config, selected);
  }

  if (target === undefined) {
    return i18n.t('removedA11y', { choice, from: describeCategory(i18n, config, from) });
  }

  const to = describeCategory(i18n, config, target);
  const inTarget = answers.find((a) => a.category === target)?.choices ?? [];
  // A category that holds one choice gives it up to the one dropped on it.
  const displaced = config.maxChoicesPerCategory === 1 ? inTarget[0] : undefined;
  const result =
    from === undefined
      ? i18n.t('placedA11y', { choice, category: to })
      : i18n.t('movedA11y', { choice, from: describeCategory(i18n, config, from), to });

  // Lists and matrices word it alike: the spec's review settled on "To make room for it" for both.
  return displaced === undefined
    ? result
    : `${result} ${i18n.t('replacedA11y', {
        removed: choiceText(i18n, config, { id: displaced, value: contentOf(config, displaced) }),
      })}`;
};
