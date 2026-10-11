import { ModelUpdatedEvent } from '@pie-element/shared-configure-events';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import RubricConfigure from '@pie-element/rubric/author';
import MultiTraitRubricConfigure from '@pie-element/multi-trait-rubric/author';
import debug from 'debug';
import { defaults } from '@pie-element/shared-lodash';
import Main, { type AuthorConfiguration, type AuthorModel } from './main.js';
import sensibleDefaults from './defaults.js';
import {
  COMPLEX_RUBRIC_MULTI_TRAIT_CONFIGURE_TAG,
  COMPLEX_RUBRIC_SIMPLE_CONFIGURE_TAG,
} from '../private-tags.js';
import type { ComplexRubricConfiguration, ComplexRubricModel, RubricModels, RubricType } from '../types.js';

/** What the author accepts: it fills in the rest of the model, and of each rubric, from the defaults. */
type ModelInput = Omit<Partial<ComplexRubricModel>, 'rubrics'> & {
  rubrics?: { [K in keyof RubricModels]?: Partial<NonNullable<RubricModels[K]>> };
} & Pick<Partial<AuthorModel>, 'errors'>;

const MODEL_UPDATED = ModelUpdatedEvent.TYPE;
const RUBRIC_TAG_NAME = COMPLEX_RUBRIC_SIMPLE_CONFIGURE_TAG;
const MULTI_TRAIT_RUBRIC_TAG_NAME = COMPLEX_RUBRIC_MULTI_TRAIT_CONFIGURE_TAG;

class ComplexSimpleRubricConfigure extends RubricConfigure {}

class ComplexMTRConfigure extends MultiTraitRubricConfigure {
}

const defineComplexRubric = () => {
  if (!customElements.get(RUBRIC_TAG_NAME)) {
    customElements.define(RUBRIC_TAG_NAME, ComplexSimpleRubricConfigure);
  }
  if (!customElements.get(MULTI_TRAIT_RUBRIC_TAG_NAME)) {
    customElements.define(MULTI_TRAIT_RUBRIC_TAG_NAME, ComplexMTRConfigure);
  }
};

defineComplexRubric();

const prepareCustomizationObject = (config: ComplexRubricConfiguration | undefined, model: AuthorModel) => {
  const configuration = defaults(config as ComplexRubricConfiguration, sensibleDefaults.configuration) as AuthorConfiguration;

  return {
    configuration,
    model,
  };
};

export default class ComplexRubricConfigureElement extends HTMLElement {
  static createDefaultModel = (
    {
      rubrics: { simpleRubric = {}, rubricless = {}, multiTraitRubric = {} } = { simpleRubric: {}, rubricless: {}, multiTraitRubric: {} },
      ...model
    }: ModelInput = {},
    currentModel: Partial<AuthorModel> = {},
  ): AuthorModel =>
  {
    const pieDefaults = sensibleDefaults?.model || {}
    return {
      ...pieDefaults,
      ...currentModel,
      ...model,
    rubrics: {
      simpleRubric: {
        ...(sensibleDefaults?.model?.rubrics || {}).simpleRubric,
        ...((currentModel.rubrics || {}) as RubricModels).simpleRubric,
        ...simpleRubric,
      },
      multiTraitRubric: {
        ...(sensibleDefaults?.model?.rubrics || {}).multiTraitRubric,
        ...((currentModel.rubrics || {}) as RubricModels).multiTraitRubric,
        ...multiTraitRubric,
      },
      rubricless: {
        ...(sensibleDefaults?.model?.rubrics || {}).rubricless,
        ...((currentModel.rubrics || {}) as RubricModels).rubricless,
        ...rubricless,
      },
    },
  }};

  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: AuthorConfiguration;
  canUpdateModel: boolean;

  constructor() {
    super();
    this._root = null;
    this.canUpdateModel = false;

    debug.log('constructor called');

    this._model = ComplexRubricConfigureElement.createDefaultModel();
    this._configuration = sensibleDefaults.configuration;

    this.onConfigurationChanged = this.onConfigurationChanged.bind(this);
  }

  set model(m: ModelInput) {
    this._model = ComplexRubricConfigureElement.createDefaultModel(m, this._model);

    this.canUpdateModel = true;
    this._render();
  }

  dispatchModelUpdated(reset?: boolean) {
    const resetValue = !!reset;

    this.dispatchEvent(new ModelUpdatedEvent(this._model, resetValue));
  }

  onModelChanged = (m: ModelInput, reset?: boolean) => {
    this._model = ComplexRubricConfigureElement.createDefaultModel(m, this._model);

    this.dispatchModelUpdated(reset);

    this._render();
  };

  set configuration(c: ComplexRubricConfiguration) {
    const info = prepareCustomizationObject(c, this._model);
    this._configuration = info.configuration;

    this._render();
  }

  onConfigurationChanged(c: ComplexRubricConfiguration) {
    this._configuration = prepareCustomizationObject(c, this._model).configuration;

    if (this._model) {
      this.onModelChanged(this._model);
    }

    this._render();
  }

  onModelUpdated = (e: Event) => {
    if (e.target === this) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    const rubricType = e.target && (e.target as Element).getAttribute('data-rubric-type');

    if (rubricType) {
      if ((e as ModelUpdatedEvent).update) {
        this._model.rubrics[rubricType as RubricType] = (e as ModelUpdatedEvent).update;
      }

      this.dispatchEvent(new ModelUpdatedEvent(this._model));
    }
  };

  connectedCallback() {
    this.addEventListener(MODEL_UPDATED, this.onModelUpdated);
    this._render();
  }

  _render() {
    let element = React.createElement(Main, {
      model: this._model,
      configuration: this._configuration,
      multiTraitRubricTagName: MULTI_TRAIT_RUBRIC_TAG_NAME,
      onModelChanged: this.onModelChanged,
      onConfigurationChanged: this.onConfigurationChanged,
      simpleRubricTagName: RUBRIC_TAG_NAME,
      canUpdateModel: this.canUpdateModel
    });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(element);
  }

  disconnectedCallback() {
    this.removeEventListener(MODEL_UPDATED, this.onModelUpdated);
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
