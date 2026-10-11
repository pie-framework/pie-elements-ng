/**
 * Shared types for the venn-classification element.
 *
 * A region is a sorted-ascending array of circle indexes:
 *   []         = outside (neither)
 *   [0]        = circle 0 only
 *   [0, 1]     = overlap of circles 0 and 1
 *   [0, 1, 2]  = triple overlap (3-set, v2)
 */

import type { ConfigureProp, PieModel } from '@pie-element/shared-types';

export type Region = number[];

/**
 * `allOrNothing` scores 1 only when every tile is in its correct region; `partialPerTile` scores the
 * fraction of tiles placed correctly.
 */
export type ScoringPolicy = 'allOrNothing' | 'partialPerTile';

export interface VennCircle {
  /** The circle's label (HTML) */
  label: string;
}

export interface VennTile {
  /** Identifier of the tile, unique within the item; sessions key placements by it */
  id: string;
  /** The tile's content (HTML) */
  label: string;
  /** Optional tile image (URL or data URI). When set, `imageAlt` should describe the image for accessibility. */
  imageUrl?: string;
  /** Short description when `imageUrl` is set (used for aria-label / announcements). */
  imageAlt?: string;
  /** The region the tile belongs in */
  correctRegion: Region;
}

/** Model for the Venn classification interaction */
export interface VennClassificationModel extends PieModel {
  /** The question prompt or item stem */
  prompt?: string;
  /** Determines if prompt should show */
  promptEnabled?: boolean;
  /** The diagram's circles; delivery lays out two */
  circles: VennCircle[];
  /** The tiles the learner sorts into regions */
  tiles: VennTile[];
  /**
   * Optional per-region label overrides. Keyed by the sorted, comma-joined region key:
   *   ""       = outside
   *   "0"      = circle 0 only
   *   "0,1"    = overlap of 0 and 1
   *   "0,1,2"  = triple overlap
   */
  regionLabels?: Record<string, string>;
  /**
   * How the response is scored
   * @default "partialPerTile"
   */
  scoringPolicy?: ScoringPolicy;
  /** Shown collapsed to instructors in view and evaluate mode. */
  teacherInstructions?: string;
  /** Unset shows `teacherInstructions`, as in multiple-choice. */
  teacherInstructionsEnabled?: boolean;
  /** The learner-facing strings' language, as `@pie-lib/translator` reads it (`en_US`, `es_ES`, …). */
  language?: string;
}

/** Config Object for @pie-element/venn-classification */
export interface VennClassificationConfiguration {
  /** Settings Panel control for the prompt; `label` titles the prompt editor */
  prompt?: ConfigureProp;
  /** Settings Panel control for the scoring policy */
  scoringPolicy?: ConfigureProp;
  /** Settings Panel control for teacher instructions; `label` titles the editor */
  teacherInstructions?: ConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
}

export interface VennClassificationSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** Keyed by tile id; `null` = still in tray, `[]` = outside region. */
  placements?: Record<string, Region | null>;
  completed?: boolean;
}

export interface VennViewModel {
  prompt: string | null;
  circles: VennCircle[];
  tiles: Array<{
    id: string;
    label: string;
    imageUrl?: string;
    imageAlt?: string;
    correctRegion?: Region;
  }>;
  regionLabels: Record<string, string>;
  scoringPolicy: ScoringPolicy;
  language?: string;
  disabled: boolean;
  mode: string | undefined;
  env: unknown;
  correctRegionsById?: Record<string, Region>;
  correctness?: Record<string, 'correct' | 'incorrect' | 'unanswered'>;
  teacherInstructions?: string | null;
}
