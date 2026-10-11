import type { MultiTraitRubricConfiguration, MultiTraitRubricModel } from '@pie-element/multi-trait-rubric';
import type { RubricConfiguration, RubricModel } from '@pie-element/rubric';
import type { ContentDimensions, ExtraCSSRules, PieModel } from '@pie-element/shared-types';

/** Indicates the type of the rubric */
export type RubricType = 'simpleRubric' | 'multiTraitRubric' | 'rubricless';

/** A simple rubric or rubricless model as complex-rubric embeds it: complex-rubric carries the id, element and accessibility catalogs. */
export type EmbeddedRubricModel = Omit<RubricModel, keyof PieModel>;

/** A multi trait rubric model as complex-rubric embeds it: complex-rubric carries the id, element and accessibility catalogs. */
export type EmbeddedMultiTraitRubricModel = Omit<MultiTraitRubricModel, keyof PieModel>;

/** Contains the model for each rubric type; `rubricType` picks the one in use. */
export interface RubricModels {
  /** Contains the simple rubric model. */
  simpleRubric?: EmbeddedRubricModel;
  /** Contains the multi trait rubric model. */
  multiTraitRubric?: EmbeddedMultiTraitRubricModel;
  /** Contains the rubricless model. */
  rubricless?: EmbeddedRubricModel;
}

/** Model for the ComplexRubricPie Interaction */
export interface ComplexRubricModel extends PieModel {
  /** Indicates the type of the rubric */
  rubricType: RubricType;
  /** Contains the model for each item type. */
  rubrics: RubricModels;
  /**
   * Shows the multi trait rubric to students. The controller reads it at this level; the multi trait
   * rubric's own `visibleToStudent` is not read here.
   */
  visibleToStudent?: boolean;
  /** Host-supplied CSS scoped to the author */
  extraCSSRules?: ExtraCSSRules;
}

/** Config Object for `@pie-element/complex-rubric` */
export interface ComplexRubricConfiguration {
  /**
   * How large should complex-rubric be. It replaces the `width` of the simple rubric and rubricless
   * configurations, and the multi trait rubric's when set.
   */
  width?: string;
  /**
   * Contains the available rubric types; the author offers a choice between them when there is more than one
   * @default ["simpleRubric", "multiTraitRubric", "rubricless"]
   */
  rubricOptions?: RubricType[];
  /** Contains the simple rubric configuration; its `width` is not read. */
  simpleRubric?: RubricConfiguration;
  /** Contains the multi trait rubric configuration. */
  multiTraitRubric?: MultiTraitRubricConfiguration;
  /** Contains the rubricless configuration, which takes effect with `rubricless: true`; its `width` is not read. */
  rubricless?: RubricConfiguration;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
}

/** The complex rubric writes nothing into its session. */
export interface ComplexRubricSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
}
