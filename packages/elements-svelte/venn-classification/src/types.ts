/**
 * Shared types for the venn-classification element.
 *
 * A region is a sorted-ascending array of circle indexes:
 *   []         = outside (neither)
 *   [0]        = circle 0 only
 *   [0, 1]     = overlap of circles 0 and 1
 *   [0, 1, 2]  = triple overlap (3-set, v2)
 */

export type Region = number[];

export type ScoringPolicy = 'allOrNothing' | 'partialPerTile';

export interface VennCircle {
  label: string;
}

export interface VennTile {
  id: string;
  label: string;
  /** Optional tile image (URL or data URI). When set, `imageAlt` should describe the image for accessibility. */
  imageUrl?: string;
  /** Short description when `imageUrl` is set (used for aria-label / announcements). */
  imageAlt?: string;
  correctRegion: Region;
}

export interface VennModel {
  id?: string;
  element?: string;
  prompt?: string;
  promptEnabled?: boolean;
  circles: VennCircle[];
  tiles: VennTile[];
  /**
   * Optional per-region label overrides. Keyed by the sorted, comma-joined region key:
   *   ""       = outside
   *   "0"      = circle 0 only
   *   "0,1"    = overlap of 0 and 1
   *   "0,1,2"  = triple overlap
   */
  regionLabels?: Record<string, string>;
  scoringPolicy?: ScoringPolicy;
}

export interface VennSession {
  id?: string;
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
  disabled: boolean;
  mode: string | undefined;
  env: unknown;
  correctRegionsById?: Record<string, Region>;
  correctness?: Record<string, 'correct' | 'incorrect' | 'unanswered'>;
  teacherInstructions?: string | null;
}
