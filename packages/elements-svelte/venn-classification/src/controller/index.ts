import defaults from './defaults.js';
import { normalizeRegion, regionsEqual } from './region.js';
import type {
  Region,
  ScoringPolicy,
  VennModel,
  VennSession,
  VennTile,
  VennViewModel,
} from '../types.js';

export {
  composeRegionLabel,
  enumerateRegions,
  getRegionLabel,
  normalizeRegion,
  regionKey,
  regionsEqual,
} from './region.js';
export type {
  Region,
  ScoringPolicy,
  VennCircle,
  VennModel,
  VennSession,
  VennTile,
  VennViewModel,
} from '../types.js';

/**
 * Circle counts that the v1 delivery surface will actually lay out.
 * The data model is N-generic; widening to 3-set delivery is a one-line change
 * plus the 3-set layout/picker once that work ships.
 */
export const SUPPORTED_CIRCLE_COUNTS = new Set<number>([2]);

const isEmptyObject = (value: unknown): boolean =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value as Record<string, unknown>).length === 0;

function tilePlainLabel(label: unknown): string {
  return String(label ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createDefaultModel(model: Partial<VennModel> = {}): VennModel {
  const merged: VennModel = {
    ...(defaults.model as VennModel),
    ...model,
  };
  if (!Array.isArray(merged.circles) || merged.circles.length === 0) {
    merged.circles = (defaults.model as VennModel).circles.map((c) => ({ ...c }));
  }
  if (!Array.isArray(merged.tiles)) {
    merged.tiles = [];
  }
  if (!merged.regionLabels || typeof merged.regionLabels !== 'object') {
    merged.regionLabels = {};
  }
  if (merged.scoringPolicy !== 'allOrNothing' && merged.scoringPolicy !== 'partialPerTile') {
    merged.scoringPolicy = 'partialPerTile';
  }
  return merged;
}

/**
 * Return a session whose `placements` map has an entry for every authored tile.
 * Unknown placement keys are preserved (so hosts that round-trip extra keys
 * don't lose them), and arrays are normalized to sorted-ascending.
 */
export function normalizeSession(
  session: VennSession | null | undefined,
  model?: VennModel
): VennSession {
  const base: VennSession = { ...(session || {}) };
  const inputPlacements = (session?.placements ?? {}) as Record<string, Region | null>;
  const placements: Record<string, Region | null> = {};

  for (const [k, v] of Object.entries(inputPlacements)) {
    if (v === null || v === undefined) {
      placements[k] = null;
    } else if (Array.isArray(v)) {
      placements[k] = normalizeRegion(v);
    } else {
      placements[k] = null;
    }
  }

  if (model?.tiles) {
    for (const tile of model.tiles) {
      if (!(tile.id in placements)) {
        placements[tile.id] = null;
      }
    }
  }

  base.placements = placements;
  base.completed = isComplete(model, { ...base, placements });
  return base;
}

/**
 * True iff every authored tile has a non-null placement.
 * Intentionally permissive about unauthored placement keys: they don't
 * contribute to completeness.
 */
export function isComplete(
  model: VennModel | null | undefined,
  session: VennSession | null | undefined
): boolean {
  if (!model || !Array.isArray(model.tiles) || model.tiles.length === 0) return false;
  const placements = session?.placements ?? {};
  for (const tile of model.tiles) {
    const p = placements[tile.id];
    if (p === null || p === undefined) return false;
  }
  return true;
}

export type Correctness = 'correct' | 'incorrect' | 'unanswered';

/** Per-tile correctness verdict. */
export function getTileCorrectness(
  tile: VennTile,
  placement: Region | null | undefined
): Correctness {
  if (placement === null || placement === undefined) return 'unanswered';
  return regionsEqual(tile.correctRegion, placement) ? 'correct' : 'incorrect';
}

/** Map tile id -> correctness, for convenience in delivery `evaluate` mode. */
export function getCorrectnessMap(
  model: VennModel,
  session: VennSession | null | undefined
): Record<string, Correctness> {
  const out: Record<string, Correctness> = {};
  const placements = session?.placements ?? {};
  for (const tile of model.tiles ?? []) {
    out[tile.id] = getTileCorrectness(tile, placements[tile.id] ?? null);
  }
  return out;
}

export function outcome(
  question: VennModel | null | undefined,
  session: VennSession | null | undefined,
  env: { mode?: string } = {}
): Promise<{ score?: number; empty?: boolean; completed?: boolean }> {
  return new Promise((resolve) => {
    if (
      !session ||
      isEmptyObject(session) ||
      !session.placements ||
      Object.keys(session.placements).length === 0
    ) {
      resolve({ score: 0, empty: true });
      return;
    }

    if (env.mode !== 'evaluate') {
      resolve({ score: undefined, completed: undefined });
      return;
    }

    const model = createDefaultModel((question as VennModel) || undefined);
    const tiles = model.tiles || [];
    if (tiles.length === 0) {
      resolve({ score: 0, empty: true });
      return;
    }

    const placements = session.placements || {};
    let correct = 0;
    let answered = 0;
    for (const tile of tiles) {
      const p = placements[tile.id];
      if (p === null || p === undefined) continue;
      answered += 1;
      if (regionsEqual(tile.correctRegion, p)) correct += 1;
    }

    if (answered === 0) {
      resolve({ score: 0, empty: true });
      return;
    }

    const policy: ScoringPolicy =
      model.scoringPolicy === 'allOrNothing' ? 'allOrNothing' : 'partialPerTile';
    if (policy === 'allOrNothing') {
      resolve({ score: correct === tiles.length ? 1 : 0 });
      return;
    }

    resolve({ score: correct / tiles.length });
  });
}

/**
 * Build the view model consumed by the delivery Svelte component.
 * Strips `correctRegion` from `tiles` unless the host is in `evaluate` mode so
 * authored answers don't leak in `gather`.
 */
export function model(
  question: VennModel | null | undefined,
  session: VennSession | null | undefined,
  env: { mode?: string; role?: string; [key: string]: unknown } = {}
): Promise<VennViewModel> {
  return new Promise((resolve) => {
    const normalizedQuestion = createDefaultModel((question as VennModel) || undefined);
    const safeEnv = env || {};

    const out: VennViewModel = {
      prompt:
        normalizedQuestion.promptEnabled === false ? null : (normalizedQuestion.prompt ?? null),
      circles: normalizedQuestion.circles.map((c) => ({ label: c?.label ?? '' })),
      tiles: normalizedQuestion.tiles.map((t) => {
        const imageUrl = String(t.imageUrl ?? '').trim();
        const imageFields =
          imageUrl.length > 0 ? { imageUrl, imageAlt: String(t.imageAlt ?? '').trim() } : {};
        return {
          id: t.id,
          label: t.label ?? '',
          ...imageFields,
          ...(safeEnv.mode === 'evaluate'
            ? { correctRegion: normalizeRegion(t.correctRegion) }
            : {}),
        };
      }),
      regionLabels: { ...(normalizedQuestion.regionLabels || {}) },
      scoringPolicy: normalizedQuestion.scoringPolicy ?? 'partialPerTile',
      disabled: safeEnv.mode !== 'gather',
      mode: safeEnv.mode,
      env: safeEnv,
    };

    if (safeEnv.mode === 'evaluate') {
      const correctRegionsById: Record<string, Region> = {};
      for (const tile of normalizedQuestion.tiles) {
        correctRegionsById[tile.id] = normalizeRegion(tile.correctRegion);
      }
      out.correctRegionsById = correctRegionsById;
      out.correctness = getCorrectnessMap(normalizedQuestion, session);
    }

    const isInstructor = safeEnv.role === 'instructor';
    if (isInstructor && (safeEnv.mode === 'view' || safeEnv.mode === 'evaluate')) {
      const anyQ = normalizedQuestion as unknown as {
        teacherInstructionsEnabled?: boolean;
        teacherInstructions?: string;
      };
      out.teacherInstructions = anyQ.teacherInstructionsEnabled
        ? (anyQ.teacherInstructions ?? null)
        : null;
    } else {
      out.teacherInstructions = null;
    }

    resolve(out);
  });
}

export function createCorrectResponseSession(
  question: VennModel | null | undefined,
  env: { mode?: string; role?: string } = {}
): Promise<VennSession | null> {
  return new Promise((resolve) => {
    if (env.mode === 'evaluate' || env.role !== 'instructor') {
      resolve(null);
      return;
    }
    const model = createDefaultModel((question as VennModel) || undefined);
    const placements: Record<string, Region> = {};
    for (const tile of model.tiles) {
      placements[tile.id] = normalizeRegion(tile.correctRegion);
    }
    resolve({
      id: '1',
      element: 'venn-classification',
      placements,
      completed: true,
    });
  });
}

/**
 * Shallow model validation for authoring surfaces. Returns a map of
 * `{field: message}`; an empty map means "valid enough to save".
 */
export function validate(
  model: VennModel | null | undefined,
  _config: unknown = {}
): Record<string, string> {
  const errors: Record<string, string> = {};
  const m = (model || {}) as VennModel;

  if (m.promptEnabled) {
    const p = (m.prompt ?? '').trim();
    if (!p || p === '<p></p>') {
      errors.prompt = 'Prompt is required when prompt is enabled';
    }
  }

  const circles = Array.isArray(m.circles) ? m.circles : [];
  if (!SUPPORTED_CIRCLE_COUNTS.has(circles.length)) {
    const supported = [...SUPPORTED_CIRCLE_COUNTS].sort((a, b) => a - b).join(' or ');
    errors.circles = `Venn classification currently supports ${supported} circles (got ${circles.length})`;
  } else {
    for (let i = 0; i < circles.length; i++) {
      const label = (circles[i]?.label ?? '').trim();
      if (!label) {
        errors.circles = `Circle ${i + 1} needs a label`;
        break;
      }
    }
  }

  const tiles = Array.isArray(m.tiles) ? m.tiles : [];
  if (tiles.length < 1) {
    errors.tiles = 'At least one tile is required';
  } else {
    const seen = new Set<string>();
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      if (!tile?.id) {
        errors.tiles = `Tile ${i + 1} is missing an id`;
        break;
      }
      if (seen.has(tile.id)) {
        errors.tiles = `Tile id "${tile.id}" appears more than once`;
        break;
      }
      seen.add(tile.id);

      const labelPlain = tilePlainLabel(tile.label);
      const imageUrl = String(tile.imageUrl ?? '').trim();
      const imageAlt = String(tile.imageAlt ?? '').trim();
      if (!labelPlain && !imageUrl) {
        errors.tiles = `Tile "${tile.id}" needs a label or an image URL`;
        break;
      }
      if (imageUrl && !imageAlt) {
        errors.tiles = `Tile "${tile.id}": when an image URL is set, short alt text is required for accessibility`;
        break;
      }

      const region = tile.correctRegion;
      if (!Array.isArray(region)) {
        errors.tiles = `Tile "${tile.id}" is missing correctRegion`;
        break;
      }

      const sorted = normalizeRegion(region);
      // Must be sorted ascending by convention, with unique in-range indexes.
      const unique = new Set(sorted);
      if (unique.size !== sorted.length) {
        errors.tiles = `Tile "${tile.id}" correctRegion has duplicate indexes`;
        break;
      }
      const outOfRange = sorted.find(
        (idx) => !Number.isInteger(idx) || idx < 0 || idx >= circles.length
      );
      if (outOfRange !== undefined) {
        errors.tiles = `Tile "${tile.id}" correctRegion index ${outOfRange} is out of range for ${circles.length} circles`;
        break;
      }
    }
  }

  if (
    m.scoringPolicy !== undefined &&
    m.scoringPolicy !== 'allOrNothing' &&
    m.scoringPolicy !== 'partialPerTile'
  ) {
    errors.scoringPolicy = 'Scoring policy must be "allOrNothing" or "partialPerTile"';
  }

  return errors;
}

/**
 * Helper for authoring-time previews: build a session that places each tile in
 * its authored correct region. Used by the authoring live preview so authors
 * see the intended final state of the diagram.
 */
export function buildPreviewSession(model: VennModel | null | undefined): VennSession {
  const m = createDefaultModel(model || undefined);
  const placements: Record<string, Region> = {};
  for (const tile of m.tiles) {
    placements[tile.id] = normalizeRegion(tile.correctRegion);
  }
  return {
    id: 'preview',
    element: 'venn-classification',
    placements,
    completed: true,
  };
}
