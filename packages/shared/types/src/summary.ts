/**
 * The element summary contract: an element's item content described as data, which a player
 * renders as a list row without loading the element. An element publishes it as a `./summary`
 * entry exporting `summarize`, and its browser build as `./browser/summary`. The vocabulary
 * follows QTI interaction terms. pie-players' item summary and list PRD owns the design:
 * https://github.com/pie-framework/pie-players/blob/develop/docs/prds/item-summary-and-list.md
 */

export interface SummaryOptions {
  /** Gates `answer` and `correct`; `student` withholds both. */
  role: 'student' | 'instructor';
}

/**
 * Describes `model`, an element model as authored. Pure and deterministic: no I/O, no clock or
 * random source, and options keep authored order whatever the model's shuffle setting. Strings are
 * HTML, unsanitized, with TeX as authored; the renderer sanitizes them.
 */
export type SummarizeFn = (model: unknown, options: SummaryOptions) => ElementSummary;

export interface ElementSummary {
  /** HTML. */
  prompt?: string;
  /** Sub-prompts in document order: blanks, rows, a multi-part element's parts. */
  parts?: SummaryPart[];
  /** Choices, dropdown entries, draggable tokens, in authored order. */
  options?: SummaryOption[];
  /** HTML, instructor only: the correct response stated as content. */
  answer?: string;
  /** One representative image for the row. */
  figure?: { src: string; alt?: string };
  /** Audio and video the element plays, by reference. */
  media?: { kind: 'audio' | 'video'; src?: string; title?: string }[];
  /** A person scores this element. */
  manualScoring?: boolean;
}

export interface SummaryPart {
  id?: string;
  /** HTML. */
  prompt?: string;
  options?: SummaryOption[];
  /** HTML, instructor only. */
  answer?: string;
}

export interface SummaryOption {
  id: string;
  /** HTML. */
  label: string;
  /** Instructor only. */
  correct?: boolean;
  /** The blank, row or category the option belongs to. */
  group?: string;
}
