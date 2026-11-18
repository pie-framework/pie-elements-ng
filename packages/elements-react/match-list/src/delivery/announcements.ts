// The screen-reader wording for match-list, built from the model and session alone so the
// delivery components stay free of it. Row numbers refer to the PIE-836 announcement spec.

import { swap } from '@pie-lib/drag';
import { findKey } from '@pie-element/shared-lodash';
import type { catalogs } from '../i18n/index.js';

type Translate = ReturnType<typeof catalogs.forLocale>['t'];
type SessionValue = Record<string, string | number | undefined>;

interface Config {
  duplicates?: boolean;
  prompts: Array<{ id: string | number; title?: string }>;
  answers: Array<{ id: string | number; title?: string }>;
}

/** The `data` dnd-kit holds for a tile or a drop target. */
interface DragData {
  type?: string;
  id?: string | number;
  promptId?: string | number;
}

const stripHtml = (html?: string) => (html ? html.replace(/<[^>]*>/g, '').trim() : '');

/** Ends a fragment with a full stop so it can be read before the next sentence. */
const sentence = (text: string) => (!text || /[.!?]$/.test(text) ? text : `${text}.`);

/**
 * Reads a template that interpolates an object's `{text}`. When the object has no text, closes the gap
 * the empty slot leaves (a doubled space, a space before a full stop, a dangling colon); otherwise the
 * string is left exactly as the author's text wrote it.
 */
const withText = (t: Translate, key: Parameters<Translate>[0], values: { text: string } & Record<string, string | number>) => {
  const read = t(key, values);

  return values.text
    ? read
    : read
        .replace(/\s+([.,。、，])/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s*[:：]\s*$/, '')
        .trim();
};

export const choiceLabel = (t: Translate, config: Config, answerId: string | number | undefined) => {
  const answer = config.answers.find((a) => String(a.id) === String(answerId));

  return stripHtml(answer?.title) || t('answerA11y', { id: String(answerId) });
};

/** The object's 1-based position and its text. */
const objectOf = (config: Config, promptId: string | number | undefined) => {
  const index = config.prompts.findIndex((p) => String(p.id) === String(promptId));

  return { number: index + 1, text: stripHtml(config.prompts[index]?.title) };
};

// Only the current prompts' entries count: a restored session can still hold ones for prompts since removed.
export const availableAnswers = (config: Config, value: SessionValue) => {
  if (config.duplicates) {
    return config.answers;
  }

  const placedIds = new Set(config.prompts.map((p) => value[p.id]).filter((v) => v != null).map(String));

  return config.answers.filter((a) => !placedIds.has(String(a.id)));
};

const countOf = (config: Config, value: SessionValue) => {
  const placed = config.prompts.filter((p) => value[p.id] != null).length;

  return { filled: placed, total: config.prompts.length, available: availableAnswers(config, value).length };
};

/** Rows 14 and 15: how much is left to do. */
const describeRemaining = (t: Translate, config: Config, value: SessionValue) => {
  const { filled, total, available } = countOf(config, value);

  return filled === total && total > 0
    ? t('completeA11y', { total })
    : t('remainingA11y', { filled, total, available });
};

/**
 * The placement the keyboard, a drop or a click commits, as a new session value. Pure, so the
 * announcement can describe the outcome without waiting for the host to re-render.
 */
export const applyPlacement = (
  value: SessionValue | undefined,
  activeData: DragData | undefined,
  overData: DragData | undefined,
  duplicates: boolean | undefined,
): SessionValue | undefined => {
  const next = computePlacement(value, activeData, overData, duplicates);
  const before = value || {};
  const same =
    Object.keys(next).length === Object.keys(before).length &&
    Object.keys(next).every((key) => next[key] === before[key]);

  // A drop that changes nothing hands back the very object it was given, so the caller can skip it.
  return same ? value : next;
};

const computePlacement = (
  value: SessionValue | undefined,
  activeData: DragData | undefined,
  overData: DragData | undefined,
  duplicates: boolean | undefined,
): SessionValue => {
  const next: SessionValue = { ...(value || {}) };

  if (!activeData || !overData) {
    return next;
  }

  // dropping a placed answer back on the pool removes it
  if (overData.type === 'choices-pool') {
    if (activeData.promptId !== undefined) {
      delete next[activeData.promptId];
    }

    return next;
  }

  if (overData.type !== 'drop-zone' || overData.promptId == null) {
    return next;
  }

  const targetPromptId = overData.promptId;
  const answerId = activeData.id;

  if (activeData.type === 'choice') {
    const existingPlacement = findKey(next, (val) => val === answerId);

    // without duplicates a choice is placed at most once, so placing a placed one swaps
    return existingPlacement && !duplicates
      ? (swap(next, existingPlacement, targetPromptId) as SessionValue)
      : { ...next, [targetPromptId]: answerId };
  }

  if (activeData.type === 'target' && activeData.promptId != null && activeData.promptId !== targetPromptId) {
    const sourcePromptId = activeData.promptId;
    const displaced = next[targetPromptId];

    if (displaced != null && !duplicates) {
      next[targetPromptId] = answerId;
      next[sourcePromptId] = displaced;
    } else {
      next[targetPromptId] = answerId;
      delete next[sourcePromptId];
    }
  }

  return next;
};

/** Rows 1 and 5: read once the prompt has been read, before the objects. */
export const describeIntro = (t: Translate, config: Config, value: SessionValue) => {
  const { filled, total } = countOf(config, value);

  return [
    t(config.duplicates ? 'introReusableA11y' : 'introNotReusableA11y', { total }),
    t('keyboardHelpA11y'),
    t('progressA11y', { filled, total }),
  ].join(' ');
};

/** Row 2 to 4: the object's number, then the state of its drop area. */
export const describeObject = (t: Translate, config: Config, index: number, answerId: string | number | undefined) => {
  const number = index + 1;

  return {
    object: t('objectA11y', { number }),
    dropArea:
      answerId != null
        ? t('dropAreaFilledA11y', { number, choice: choiceLabel(t, config, answerId) })
        : t('dropAreaEmptyA11y', { number }),
  };
};

/** Row 8: an answer choice has been selected. */
export const describeSelection = (t: Translate, config: Config, answerId: string | number | undefined) =>
  t('selectedA11y', { choice: choiceLabel(t, config, answerId) });

/** Rows 6 and 7: the name of an answer choice tile, in the pool or in a drop area. */
export const describeChoiceTile = (
  t: Translate,
  config: Config,
  answerId: string | number | undefined,
  promptId?: string | number,
) => {
  const choice = choiceLabel(t, config, answerId);

  if (promptId === undefined || promptId === null) {
    return t('answerChoiceA11y', { choice });
  }

  const { number, text } = objectOf(config, promptId);

  return withText(t, 'answerChoiceInDropAreaA11y', { choice, number, text });
};

/** Rows 9 and 18: the selection ended without moving anything. */
export const describeDeselection = (t: Translate, config: Config, answerId: string | number | undefined) =>
  t('deselectedA11y', { choice: choiceLabel(t, config, answerId) });

/** Rows 10 to 12: the drop target that now has focus while an answer choice is selected. */
export const describeFocusTarget = (
  t: Translate,
  config: Config,
  selected: DragData,
  over: DragData,
) => {
  const choice = choiceLabel(t, config, selected.id);

  if (over.type === 'choices-pool') {
    if (selected.promptId === undefined || selected.promptId === null) {
      return t('overPoolUnplacedA11y', { choice });
    }

    const { number, text } = objectOf(config, selected.promptId);

    return withText(t, 'overPoolFromDropAreaA11y', { choice, number, text });
  }

  const { number, text } = objectOf(config, over.promptId);

  return withText(t, 'overDropAreaA11y', { number, text, choice });
};

/** Rows 13 to 18: what a drop, a keypress or a click just did. */
export const describePlacementResult = (
  t: Translate,
  config: Config,
  value: SessionValue,
  selected: DragData,
  over: DragData,
) => {
  const choice = choiceLabel(t, config, selected.id);
  const next = applyPlacement(value, selected, over, config.duplicates);

  // Nothing moved (dropped back where it was, or on the pool from the pool): the selection just ended.
  if (next === value) {
    return describeDeselection(t, config, selected.id);
  }

  const remaining = describeRemaining(t, config, next ?? {});
  const fromPool = selected.promptId === undefined || selected.promptId === null;

  if (over.type === 'choices-pool') {
    const { number } = objectOf(config, selected.promptId);

    return [sentence(t('removedA11y', { choice, number })), remaining].join(' ');
  }

  const target = objectOf(config, over.promptId);

  if (fromPool) {
    return [
      sentence(withText(t, 'placedA11y', { choice, number: target.number, text: target.text })),
      remaining,
    ].join(' ');
  }

  const source = objectOf(config, selected.promptId);

  return [
    sentence(
      withText(t, 'movedA11y', { choice, from: source.number, to: target.number, text: sentence(target.text) }),
    ),
    remaining,
  ].join(' ');
};

/** Row 5: the answer choices still available, in the order they are read. */
export const describeAvailableChoices = (t: Translate, config: Config, value: SessionValue) => {
  const available = availableAnswers(config, value);

  return {
    count: t('availableCountA11y', { count: available.length }),
    choices: available.map((a) => t('answerChoiceA11y', { choice: choiceLabel(t, config, a.id) })),
    end: t('availableEndA11y'),
  };
};
