// The screen-reader wording for drag-in-the-blank, built from the markup, choices and session value
// alone so the components stay free of it. Row numbers refer to the PIE-1022 announcement spec.

import { speakChoice } from './choice-speech.js';
import { catalogs } from './i18n/index.js';

type Translate = ReturnType<typeof catalogs.forLocale>['t'];

/** The language's translator, ready to hand around; `onLoad` runs once its catalog has landed. */
export const translatorFor = (language: string | undefined, onLoad?: () => void): Translate => {
  const i18n = catalogs.forLocale(language, onLoad);

  return i18n.t.bind(i18n);
};
type SessionValue = Record<string, string | undefined>;

export interface Config {
  markup?: string;
  duplicates?: boolean;
  choices: Array<{ id: string; value?: string }>;
}

/** The `data` dnd-kit holds for a choice tile, a filled blank or a drop target. */
export interface DragData {
  id?: string | number;
  choice?: { id: string; value?: string };
  fromChoice?: boolean;
  toChoiceBoard?: boolean;
}

/** Ends a fragment with a full stop so it can be read before the next sentence. */
const sentence = (text: string) => (!text || /[.!?。！？]$/.test(text) ? text : `${text}.`);

/**
 * A choice's words for a tile or blank name, or undefined when the name is better left to the content:
 * nothing to say (an image without alt text), or math the renderer cannot speak yet.
 */
const nameText = (choice?: { value?: string }) => {
  const { text, complete } = speakChoice(choice?.value);

  return complete && text ? text : undefined;
};

/** Blank ids in reading order, from the {{n}} placeholders of the markup. */
export const blankIds = (markup?: string) => [
  ...new Set(Array.from((markup || '').matchAll(/\{\{(\d+)\}\}/g), (m) => m[1])),
];

/** A blank's number as the student hears it; ids are the authored placeholders, numbered from 0. */
const numberOf = (id: string | number | undefined) => Number(id) + 1;

const choiceOf = (config: Config, choiceId: string | undefined) => config.choices.find((c) => c.id === choiceId);

// A choice is said as its tile names it, math spoken; one with nothing to say (an image without alt
// text) is named by its position among the choices, not its opaque id.
const choiceLabel = (t: Translate, config: Config, choiceId: string | undefined) => {
  const position = config.choices.findIndex((c) => c.id === choiceId) + 1;

  return speakChoice(choiceOf(config, choiceId)?.value).text || t('answerA11y', { id: position || String(choiceId) });
};

// Only the current blanks' entries count as filled: a restored session can still hold ones for blanks since removed.
const placedChoiceIds = (config: Config, value: SessionValue) =>
  blankIds(config.markup)
    .map((id) => value[id])
    .filter((v): v is string => v != null && choiceOf(config, v) !== undefined);

export const availableChoices = (config: Config, value: SessionValue) => {
  if (config.duplicates) {
    return config.choices;
  }

  // The pool hides a choice placed anywhere in the session, so the count follows the same rule.
  const placed = new Set(Object.values(value).filter((v): v is string => v != null));

  return config.choices.filter((c) => !placed.has(c.id));
};

const countOf = (config: Config, value: SessionValue) => ({
  filled: placedChoiceIds(config, value).length,
  total: blankIds(config.markup).length,
  available: availableChoices(config, value).length,
});

/** Rows 14 and 15: how much is left to do. */
const describeRemaining = (t: Translate, config: Config, value: SessionValue) => {
  const { filled, total, available } = countOf(config, value);

  return filled === total && total > 0
    ? t('completeA11y', { total })
    : t('remainingA11y', { filled, total, available });
};

/**
 * The placement a drop, the keyboard or a click commits, as a new session value; `targetId` is the
 * blank it lands in, or undefined for the choice board. Pure, so the announcement can describe the
 * outcome without waiting for the host to re-render.
 */
export const applyPlacement = (
  value: SessionValue | undefined,
  dragged: DragData | undefined,
  targetId: string | number | undefined,
): SessionValue | undefined => {
  const before = value || {};

  if (!dragged) {
    return value;
  }

  if (targetId === undefined) {
    // dropping a placed answer back on the board removes it
    if (dragged.fromChoice || dragged.id == null || before[dragged.id] === undefined) {
      return value;
    }

    const next = { ...before };
    delete next[dragged.id];

    return next;
  }

  const choiceId = dragged.choice?.id;

  if (choiceId === undefined) {
    return value;
  }

  if (dragged.fromChoice) {
    return before[targetId] === choiceId ? value : { ...before, [targetId]: choiceId };
  }

  if (dragged.id == null || String(dragged.id) === String(targetId)) {
    return value;
  }

  const next = { ...before, [targetId]: choiceId };
  delete next[dragged.id];

  return next;
};

/** Rows 1 and 5: read after the prompt, before the template. */
export const describeIntro = (t: Translate, config: Config, value: SessionValue) => {
  const { filled, total } = countOf(config, value);

  return [
    t('introCountA11y', { blanks: total, choices: config.choices.length }),
    t('introDropAreaA11y'),
    t(config.duplicates ? 'introReusableA11y' : 'introNotReusableA11y'),
    t('keyboardHelpA11y'),
    t('progressA11y', { filled, total }),
  ].join(' ');
};

/** Row 2: a blank as the template reads it. Undefined when its choice has to name itself. */
export const describeBlank = (t: Translate, id: string | number, choice?: { value?: string }) => {
  const number = numberOf(id);

  if (!choice) {
    return t('blankEmptyA11y', { number });
  }

  const text = nameText(choice);

  return text === undefined ? undefined : t('blankFilledA11y', { number, choice: text });
};

/** Rows 6 and 7: the name of a choice tile, in the pool or in a blank. Undefined when it names itself. */
export const describeChoiceTile = (
  t: Translate,
  choice: { id: string; value?: string },
  blankId?: string | number,
) => {
  const text = nameText(choice);

  if (text === undefined) {
    return undefined;
  }

  return blankId === undefined || blankId === null
    ? t('answerChoiceA11y', { choice: text })
    : t('answerChoiceInBlankA11y', { choice: text, number: numberOf(blankId) });
};

/** Row 8: a choice has been selected. */
export const describeSelection = (t: Translate, config: Config, choiceId: string | undefined) =>
  t('selectedA11y', { choice: choiceLabel(t, config, choiceId) });

/** Rows 9 and 18: the selection ended without moving anything. */
export const describeDeselection = (t: Translate, config: Config, choiceId: string | undefined) =>
  t('deselectedA11y', { choice: choiceLabel(t, config, choiceId) });

export const describeNotOverBlank = (t: Translate, config: Config, choiceId: string | undefined) =>
  t('notOverBlankA11y', { choice: choiceLabel(t, config, choiceId) });

/** Rows 10 to 12: the drop target that now has focus while a choice is selected. */
export const describeFocusTarget = (t: Translate, config: Config, selected: DragData, over: DragData) => {
  const choice = choiceLabel(t, config, selected.choice?.id);

  if (over.toChoiceBoard) {
    return selected.fromChoice === false && selected.id != null
      ? t('overPoolFromBlankA11y', { number: numberOf(selected.id), choice })
      : t('overPoolUnplacedA11y', { choice });
  }

  return t('overBlankA11y', { number: numberOf(over.id), choice });
};

/** Rows 13 to 18: what a drop, a keypress or a click just did, judged against the session before it. */
export const describePlacementResult = (
  t: Translate,
  config: Config,
  value: SessionValue,
  selected: DragData,
  targetId: string | number | undefined,
) => {
  const choice = choiceLabel(t, config, selected.choice?.id);
  const next = applyPlacement(value, selected, targetId);

  // Nothing moved (dropped back where it was, or on the board from the board): the selection just ended.
  if (next === value) {
    return describeDeselection(t, config, selected.choice?.id);
  }

  const remaining = describeRemaining(t, config, next ?? {});

  if (targetId === undefined) {
    return [sentence(t('removedA11y', { choice, number: numberOf(selected.id) })), remaining].join(' ');
  }

  if (selected.fromChoice) {
    return [sentence(t('placedA11y', { choice, number: numberOf(targetId) })), remaining].join(' ');
  }

  return [
    sentence(t('movedA11y', { choice, from: numberOf(selected.id), to: numberOf(targetId) })),
    remaining,
  ].join(' ');
};

/** Row 3: the choices still available, in the order they are read. */
export const describeAvailableChoices = (t: Translate, config: Config, value: SessionValue) => ({
  count: t('availableCountA11y', { count: availableChoices(config, value).length }),
  end: t('availableEndA11y'),
});
