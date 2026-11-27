// The screen-reader wording for image-cloze-association, built from the model and the learner's
// answers alone so the delivery components stay free of it. Row numbers refer to the spec's table.

import type { catalogs } from '../i18n/index.js';

type I18n = ReturnType<typeof catalogs.forLocale>;

export interface ResponseContainer {
  index?: number;
  ariaLabel?: string;
  aria_label?: string;
}

/** A choice, in the pool or in a response container (`containerIndex` is set when it is placed). */
export interface Choice {
  id?: string;
  value: string;
  containerIndex?: number;
}

export interface Config {
  alt?: string;
  containers: ResponseContainer[];
  /** The model's choices, which fix each one's position. */
  possibleResponses: string[];
  maxResponsePerZone: number;
  duplicateResponses?: boolean;
}

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

// Fallback for where there is no DOM (server rendering): named and numeric entities, in one pass.
const decode = (text: string) =>
  text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (entity, dec, hex, name) => {
    const code = dec ? Number(dec) : hex ? parseInt(hex, 16) : undefined;

    return code !== undefined ? String.fromCodePoint(code) : (ENTITIES[name.toLowerCase()] ?? entity);
  });

const textOf = (html: string) => {
  if (typeof DOMParser === 'undefined') {
    return decode(html.replace(/<[^>]*>/g, ' '));
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Block boundaries read as spaces, so "<p>a</p><p>b</p>" is "a b", not "ab".
  doc.body.querySelectorAll('p, div, br, li, tr').forEach((el) => el.append(' '));

  return doc.body.textContent ?? '';
};

/** The text of an HTML choice: its words, else the alt text of its image. */
export const plainText = (html: string | undefined) => {
  if (!html) {
    return '';
  }

  const text = textOf(html).replace(/\s+/g, ' ').trim();

  return text || (/<img\b[^>]*\balt\s*=\s*["']([^"']*)["']/i.exec(html)?.[1] ?? '').trim();
};

// Math (MathML, LaTeX) and media that stripping the tags would read wrongly, or not at all.
const RICH_CONTENT = /<math\b|data-latex|\\\(|\\\[|\$\$|<mjx|<svg\b|<audio\b|<video\b|<object\b|<embed\b|<iframe\b/i;

export const hasRichContent = (html: string | undefined) => !!html && RICH_CONTENT.test(html);

/** What the learner hears for a choice: its text, else its position among the model's choices. */
export const choiceText = (i18n: I18n, config: Config, value: string) => {
  const text = hasRichContent(value) ? '' : plainText(value);

  return text || i18n.t('unnamedChoiceA11y', { index: config.possibleResponses.indexOf(value) + 1 });
};

/** The drop area's name: the author's ARIA label, else its position among the areas. */
export const areaLabel = (i18n: I18n, containers: ResponseContainer[], containerIndex: number | undefined) => {
  const found = containers.findIndex((c, i) => (c.index ?? i) === containerIndex);
  // A container the index names no one of is still one of the list, by its place in it.
  const position = found >= 0 ? found : Math.min(Math.max(containerIndex ?? 0, 0), Math.max(containers.length - 1, 0));
  const container = containers[position];

  return (
    (container?.ariaLabel ?? container?.aria_label)?.trim() ||
    i18n.t('responseArea', { index: position + 1, total: containers.length })
  );
};

const hasManyAreas = (config: Config) => config.containers.length > 1;

/** Rows 1 to 4 of the intro, one paragraph each, read after the prompt. */
export const describeIntro = (
  i18n: I18n,
  config: Config,
  answers: Choice[],
  available: Array<{ value: string }>,
): string[] => {
  const { containers, maxResponsePerZone: capacity, possibleResponses } = config;
  const areas = containers.length;
  const alt = config.alt?.trim();
  const holds = capacity > 1 ? 'Multi' : 'Single';
  const areaCount = areas === 1 ? 'SingleArea' : 'MultiAreas';
  const reuse = config.duplicateResponses ? 'introChoicesReusableA11y' : 'introChoicesNotReusableA11y';

  const structure = [
    alt ? i18n.t('introImageA11y', { alt: alt.replace(/[.!?]+$/, '') }) : i18n.t('introImageNoAltA11y'),
    i18n.t(`intro${areaCount}${holds}A11y` as 'introSingleAreaSingleA11y', { areas, capacity }),
    i18n.plural(reuse, { count: possibleResponses.length }),
  ].join(' ');

  const areaParagraphs = containers.map((container, i) => {
    const containerIndex = container.index ?? i;
    const label = areaLabel(i18n, containers, containerIndex);
    const placed = answers.filter((a) => a.containerIndex === containerIndex);

    if (placed.length === 0) {
      return i18n.t('dropAreaEmptyA11y', { label });
    }

    if (capacity <= 1) {
      return i18n.t('dropAreaSingleFilledA11y', { label, choice: choiceText(i18n, config, placed[0].value) });
    }

    return [
      i18n.t('dropAreaContainsA11y', { label }),
      ...placed.map((a) => i18n.t('dropAreaChoiceA11y', { choice: choiceText(i18n, config, a.value) })),
      i18n.t('dropAreaEndA11y'),
    ].join(' ');
  });

  return [structure, i18n.t('keyboardHelpA11y'), ...areaParagraphs, describeAvailable(i18n, config, available)];
};

/** Row 4: the choices still in the pool, in the order they are read. */
export const describeAvailable = (i18n: I18n, config: Config, available: Array<{ value: string }>) => {
  const count = available.length;
  const header = i18n.plural('availableA11y', { count });

  if (count === 0) {
    return header;
  }

  if (count === 1) {
    return [header, choiceText(i18n, config, available[0].value), i18n.t('tabToChoiceA11y')].join(' ');
  }

  return [
    header,
    ...available.map((a) => i18n.t('availableChoiceA11y', { choice: choiceText(i18n, config, a.value) })),
    i18n.t('availableEndA11y'),
    i18n.t('tabToChoicesA11y'),
  ].join(' ');
};

/** Rows 5 and 6: the name of a choice tile, in the pool or in a drop area. */
export const describeChoiceTile = (i18n: I18n, config: Config, choice: Choice) => {
  const text = choiceText(i18n, config, choice.value);

  return choice.containerIndex === undefined
    ? i18n.t('answerChoiceA11y', { choice: text })
    : i18n.t('answerChoiceInDropAreaA11y', {
        choice: text,
        label: areaLabel(i18n, config.containers, choice.containerIndex),
      });
};

/** Row 7: a choice was selected. */
export const describeSelection = (i18n: I18n, config: Config, choice: Choice) =>
  i18n.t(hasManyAreas(config) ? 'selectedMultiAreasA11y' : 'selectedSingleAreaA11y', {
    choice: choiceText(i18n, config, choice.value),
  });

/** Rows 8 and 15: the selection ended without moving anything. */
export const describeDeselection = (i18n: I18n, config: Config, choice: Choice) =>
  i18n.t('deselectedA11y', { choice: choiceText(i18n, config, choice.value) });

/** Rows 9 to 11: the drop target that has focus while a choice is selected. `target` is undefined for the pool. */
export const describeFocusTarget = (
  i18n: I18n,
  config: Config,
  selected: Choice,
  target: number | undefined,
) => {
  const choice = choiceText(i18n, config, selected.value);
  const many = hasManyAreas(config);

  if (target !== undefined) {
    return i18n.t(many ? 'overAreaMultiA11y' : 'overAreaSingleA11y', {
      label: areaLabel(i18n, config.containers, target),
      choice,
    });
  }

  if (selected.containerIndex !== undefined) {
    return i18n.t(many ? 'overPoolFromAreaMultiA11y' : 'overPoolFromAreaSingleA11y', {
      label: areaLabel(i18n, config.containers, selected.containerIndex),
      choice,
    });
  }

  return i18n.t(many ? 'overPoolUnplacedMultiA11y' : 'overPoolUnplacedSingleA11y', { choice });
};

/**
 * Rows 12 to 15: what dropping `selected` on a drop area (`target`) or the pool (undefined) just did,
 * read against the answers as they are *before* the drop, which the component then applies.
 */
export const describePlacementResult = (
  i18n: I18n,
  config: Config,
  answers: Choice[],
  selected: Choice,
  target: number | undefined,
) => {
  const choice = choiceText(i18n, config, selected.value);
  const from = selected.containerIndex;

  // Nothing moves: dropped back where it was, or on the pool from the pool.
  if (from === target) {
    return describeDeselection(i18n, config, selected);
  }

  if (target === undefined) {
    return i18n.t('removedA11y', { choice, label: areaLabel(i18n, config.containers, from) });
  }

  const label = areaLabel(i18n, config.containers, target);
  const inTarget = answers.filter((a) => a.containerIndex === target);
  const displaced = config.maxResponsePerZone === 1 ? inTarget[0] : undefined;
  const result =
    from === undefined
      ? i18n.t('placedA11y', { choice, label })
      : i18n.t('movedA11y', { choice, from: areaLabel(i18n, config.containers, from), to: label });

  return displaced
    ? `${result} ${i18n.t('replacedA11y', { removed: choiceText(i18n, config, displaced.value) })}`
    : result;
};
