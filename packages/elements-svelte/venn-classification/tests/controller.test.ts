import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_CIRCLE_COUNTS,
  buildPreviewSession,
  createCorrectResponseSession,
  createDefaultModel,
  getCorrectnessMap,
  isComplete,
  model as buildViewModel,
  normalizeSession,
  outcome,
  validate,
} from '../src/controller/index.js';
import type { VennModel, VennSession } from '../src/types.js';

function twoSetModel(overrides: Partial<VennModel> = {}): VennModel {
  return createDefaultModel({
    circles: [{ label: 'A' }, { label: 'B' }],
    tiles: [
      { id: 't1', label: 'one', correctRegion: [0] },
      { id: 't2', label: 'two', correctRegion: [1] },
      { id: 't3', label: 'three', correctRegion: [0, 1] },
      { id: 't4', label: 'four', correctRegion: [] },
    ],
    ...overrides,
  });
}

describe('SUPPORTED_CIRCLE_COUNTS', () => {
  it('is limited to 2 for v1', () => {
    expect(SUPPORTED_CIRCLE_COUNTS.has(2)).toBe(true);
    expect(SUPPORTED_CIRCLE_COUNTS.has(3)).toBe(false);
    expect(SUPPORTED_CIRCLE_COUNTS.has(1)).toBe(false);
  });
});

describe('createDefaultModel', () => {
  it('fills in sane defaults from an empty input', () => {
    const m = createDefaultModel({});
    expect(m.circles.length).toBe(2);
    expect(m.tiles).toEqual([]);
    expect(m.scoringPolicy).toBe('partialPerTile');
    expect(m.regionLabels).toEqual({});
  });

  it('carries no `id` or `element`, which the item config and the player supply', () => {
    // A player registers a versioned tag and stamps it as `element`; a default
    // `element` would name a tag nothing registered.
    const m = createDefaultModel({});
    expect(m).not.toHaveProperty('id');
    expect(m).not.toHaveProperty('element');
    expect(createDefaultModel({ id: '7', element: 'x--version-1-0-0' })).toMatchObject({
      id: '7',
      element: 'x--version-1-0-0',
    });
  });
});

describe('validate', () => {
  it('passes a well-formed 2-set model', () => {
    expect(validate(twoSetModel())).toEqual({});
  });

  it('rejects missing prompt when promptEnabled', () => {
    expect(validate(twoSetModel({ promptEnabled: true, prompt: '' })).prompt).toMatch(/prompt/i);
  });

  it('allows missing prompt when promptEnabled is false', () => {
    expect(validate(twoSetModel({ promptEnabled: false, prompt: '' })).prompt).toBeUndefined();
  });

  it('rejects circle counts outside SUPPORTED_CIRCLE_COUNTS', () => {
    const m = twoSetModel({ circles: [{ label: 'A' }] });
    expect(validate(m).circles).toMatch(/circles/i);
    const m3 = twoSetModel({ circles: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] });
    expect(validate(m3).circles).toMatch(/circles/i);
  });

  it('rejects blank circle labels', () => {
    const m = twoSetModel({ circles: [{ label: 'A' }, { label: '  ' }] });
    expect(validate(m).circles).toMatch(/label/i);
  });

  it('rejects duplicate tile ids', () => {
    const m = twoSetModel({
      tiles: [
        { id: 'dup', label: 'x', correctRegion: [0] },
        { id: 'dup', label: 'y', correctRegion: [1] },
      ],
    });
    expect(validate(m).tiles).toMatch(/more than once/);
  });

  it('rejects tiles with no label and no image', () => {
    const m = twoSetModel({
      tiles: [{ id: 't', label: '  ', correctRegion: [0] }],
    });
    expect(validate(m).tiles).toMatch(/label or an image URL/i);
  });

  it('allows image-only tiles when alt text is present', () => {
    const m = twoSetModel({
      tiles: [
        {
          id: 'pic',
          label: ' ',
          imageUrl: 'https://example.com/a.png',
          imageAlt: 'Fox',
          correctRegion: [0],
        },
      ],
    });
    expect(validate(m)).toEqual({});
  });

  it('rejects image URL without alt text', () => {
    const m = twoSetModel({
      tiles: [
        {
          id: 'pic',
          label: 'Caption',
          imageUrl: 'https://example.com/a.png',
          imageAlt: '  ',
          correctRegion: [0],
        },
      ],
    });
    expect(validate(m).tiles).toMatch(/alt text is required/i);
  });

  it('rejects empty tiles list', () => {
    const m = twoSetModel({ tiles: [] });
    expect(validate(m).tiles).toMatch(/at least one/i);
  });

  it('rejects out-of-range region indexes', () => {
    const m = twoSetModel({
      tiles: [{ id: 't', label: 'x', correctRegion: [5] }],
    });
    expect(validate(m).tiles).toMatch(/out of range/);
  });

  it('rejects duplicate region indexes', () => {
    const m = twoSetModel({
      tiles: [{ id: 't', label: 'x', correctRegion: [0, 0] }],
    });
    expect(validate(m).tiles).toMatch(/duplicate/);
  });

  it('rejects invalid scoring policy', () => {
    const m = twoSetModel();
    (m as any).scoringPolicy = 'bogus';
    expect(validate(m).scoringPolicy).toMatch(/scoring/i);
  });
});

describe('normalizeSession', () => {
  it('fills in missing placement keys for authored tiles', () => {
    const m = twoSetModel();
    const s = normalizeSession({ placements: { t1: [0] } }, m);
    expect(Object.keys(s.placements ?? {}).sort()).toEqual(['t1', 't2', 't3', 't4']);
    expect(s.placements?.t2).toBeNull();
  });
  it('normalizes placement arrays to sorted-ascending', () => {
    const m = twoSetModel();
    const s = normalizeSession({ placements: { t3: [1, 0] as any } }, m);
    expect(s.placements?.t3).toEqual([0, 1]);
  });
  it('preserves unknown placement keys', () => {
    const m = twoSetModel();
    const s = normalizeSession({ placements: { t1: [0], strayKey: [1] as any } }, m);
    expect((s.placements as any).strayKey).toEqual([1]);
  });
});

describe('isComplete', () => {
  it('true only when every tile has a non-null placement', () => {
    const m = twoSetModel();
    expect(isComplete(m, { placements: { t1: [0], t2: [1], t3: [0, 1], t4: [] } })).toBe(true);
    expect(isComplete(m, { placements: { t1: [0], t2: [1], t3: [0, 1], t4: null } })).toBe(false);
    expect(isComplete(m, { placements: {} })).toBe(false);
  });
});

describe('outcome', () => {
  const m = twoSetModel();
  const correct: VennSession = {
    placements: { t1: [0], t2: [1], t3: [0, 1], t4: [] },
  };
  const partial: VennSession = {
    placements: { t1: [0], t2: [1], t3: [0], t4: [] },
  };
  const wrong: VennSession = {
    placements: { t1: [1], t2: [0], t3: [], t4: [0, 1] },
  };

  it('returns score 1 for an all-correct session under partial scoring', async () => {
    expect(await outcome(m, correct, { mode: 'evaluate' })).toMatchObject({
      score: 1,
      empty: false,
    });
  });

  it('returns proportional score for partial credit', async () => {
    expect(await outcome(m, partial, { mode: 'evaluate' })).toMatchObject({
      score: 0.75,
      empty: false,
    });
  });

  it('returns 0 for all-wrong', async () => {
    expect(await outcome(m, wrong, { mode: 'evaluate' })).toMatchObject({
      score: 0,
      empty: false,
    });
  });

  it('rounds partial credit to two decimals, as multiple-choice and categorize do', async () => {
    const three = twoSetModel({
      tiles: [
        { id: 'a', label: 'a', correctRegion: [0] },
        { id: 'b', label: 'b', correctRegion: [1] },
        { id: 'c', label: 'c', correctRegion: [] },
      ],
    });
    const oneOfThree = { placements: { a: [0], b: [0], c: [0] } };
    const twoOfThree = { placements: { a: [0], b: [1], c: [0] } };
    expect((await outcome(three, oneOfThree, { mode: 'evaluate' })).score).toBe(0.33);
    expect((await outcome(three, twoOfThree, { mode: 'evaluate' })).score).toBe(0.67);
  });

  it('allOrNothing returns 0 unless fully correct', async () => {
    const mm = twoSetModel({ scoringPolicy: 'allOrNothing' });
    expect((await outcome(mm, partial, { mode: 'evaluate' })).score).toBe(0);
    expect((await outcome(mm, correct, { mode: 'evaluate' })).score).toBe(1);
  });

  it('scores all-or-nothing when the player passes env.partialScoring = false', async () => {
    // pie-players forwards `env.partialScoring` into outcome(); `false` forces
    // dichotomous scoring over the item's partialPerTile policy.
    const env = { mode: 'evaluate', partialScoring: false };
    expect((await outcome(m, partial, env)).score).toBe(0);
    expect((await outcome(m, correct, env)).score).toBe(1);
    expect((await outcome(m, partial, { mode: 'evaluate', partialScoring: true })).score).toBe(
      0.75
    );
  });

  it('empty session resolves to { score: 0, empty: true }', async () => {
    expect(await outcome(m, {} as any, { mode: 'evaluate' })).toMatchObject({
      score: 0,
      empty: true,
    });
    expect(await outcome(m, { placements: {} }, { mode: 'evaluate' })).toMatchObject({
      score: 0,
      empty: true,
    });
    expect(
      await outcome(m, { placements: { t1: null, t2: null, t3: null, t4: null } }, {})
    ).toMatchObject({ score: 0, empty: true });
    expect(await outcome(m, undefined, { mode: 'evaluate' })).toMatchObject({
      score: 0,
      empty: true,
    });
  });

  it('scores outside evaluate mode, as multiple-choice does', async () => {
    expect(await outcome(m, partial, { mode: 'gather' })).toMatchObject({
      score: 0.75,
      empty: false,
    });
    expect((await outcome(m, correct, {})).score).toBe(1);
  });

  it('returns a traceLog explaining the score', async () => {
    const result = await outcome(m, partial, { mode: 'evaluate' });
    expect(result.traceLog).toEqual([
      'Student placed 4 of 4 tile(s); 3 in the correct region.',
      'Score calculated using partial scoring.',
      'Final score: 0.75.',
    ]);
    const forced = await outcome(m, partial, { mode: 'evaluate', partialScoring: false });
    expect(forced.traceLog).toContain('Score calculated using all-or-nothing scoring.');
    const empty = await outcome(m, {}, { mode: 'evaluate' });
    expect(empty.traceLog).toEqual(['Student did not place any tiles. Score is 0.']);
  });
});

describe('getCorrectnessMap', () => {
  it('returns per-tile verdicts', () => {
    const m = twoSetModel();
    const map = getCorrectnessMap(m, {
      placements: { t1: [0], t2: [0], t3: null, t4: [] },
    });
    expect(map).toEqual({ t1: 'correct', t2: 'incorrect', t3: 'unanswered', t4: 'correct' });
  });
});

describe('createCorrectResponseSession', () => {
  it('returns null for students', async () => {
    expect(
      await createCorrectResponseSession(twoSetModel(), { role: 'student', mode: 'gather' })
    ).toBeNull();
  });
  it('returns null when evaluating as instructor', async () => {
    expect(
      await createCorrectResponseSession(twoSetModel(), { role: 'instructor', mode: 'evaluate' })
    ).toBeNull();
  });
  it('returns a full-correct placements map for instructors in gather/view', async () => {
    const s = await createCorrectResponseSession(twoSetModel(), {
      role: 'instructor',
      mode: 'gather',
    });
    expect(s).not.toBeNull();
    expect(s?.completed).toBe(true);
    expect(s?.placements).toEqual({ t1: [0], t2: [1], t3: [0, 1], t4: [] });
  });
  it('leaves `element` to the player, which stamps the tag it registered', async () => {
    // A player builds the entry as `{ id, element: model.element, ...session }`,
    // so an `element` here would replace its versioned tag.
    const s = await createCorrectResponseSession(twoSetModel(), {
      role: 'instructor',
      mode: 'gather',
    });
    expect(s).not.toHaveProperty('element');
  });
});

describe('model (view-model builder)', () => {
  it('passes the language through for the translated strings', async () => {
    const vm = await buildViewModel(
      twoSetModel({ language: 'es_ES' }),
      { placements: {} },
      { mode: 'gather' }
    );
    expect(vm.language).toBe('es_ES');
  });

  it('strips correctRegion from tiles in gather mode', async () => {
    const vm = await buildViewModel(twoSetModel(), { placements: {} }, { mode: 'gather' });
    expect(vm.tiles.every((t) => !('correctRegion' in t))).toBe(true);
    expect(vm.disabled).toBe(false);
  });

  it('passes optional tile image fields through in gather mode', async () => {
    const m = twoSetModel({
      tiles: [
        {
          id: 'img',
          label: 'Fox',
          imageUrl: 'https://example.com/fox.png',
          imageAlt: 'Red fox',
          correctRegion: [0],
        },
      ],
    });
    const vm = await buildViewModel(m, { placements: { img: null } }, { mode: 'gather' });
    expect(vm.tiles[0]).toMatchObject({
      id: 'img',
      label: 'Fox',
      imageUrl: 'https://example.com/fox.png',
      imageAlt: 'Red fox',
    });
  });

  it('includes correctRegion and correctness map in evaluate mode', async () => {
    const vm = await buildViewModel(
      twoSetModel(),
      { placements: { t1: [0], t2: [0], t3: null, t4: null } },
      { mode: 'evaluate' }
    );
    expect(vm.tiles.every((t) => 'correctRegion' in t)).toBe(true);
    expect(vm.correctRegionsById).toBeTruthy();
    expect(vm.correctness).toMatchObject({ t1: 'correct', t2: 'incorrect' });
    expect(vm.disabled).toBe(true);
  });
});

describe('buildPreviewSession', () => {
  it('places every tile in its authored correct region', () => {
    const m = twoSetModel();
    const s = buildPreviewSession(m);
    expect(s.placements).toEqual({ t1: [0], t2: [1], t3: [0, 1], t4: [] });
    expect(s.completed).toBe(true);
    expect(s).not.toHaveProperty('element');
  });
});
