import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import debug from 'debug';
import { defaults, isArray } from '@pie-element/shared-lodash';
import {
  ModelUpdatedEvent,
  DeleteImageEvent,
  InsertImageEvent,
  InsertSoundEvent,
  DeleteSoundEvent,
  type DeleteDone,
  type ImageHandler,
  type SoundHandler,
} from '@pie-element/shared-configure-events';

import Main, { type AuthorModel } from './design.js';

import sensibleDefaults from './defaults.js';
import { processMarkup, createSlateMarkup } from './markupUtils.js';
import type { MathTemplatedConfiguration, MathTemplatedResponse } from '../types.js';

const log = debug('math-templated:configure');

export default class MathTemplateConfigure extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: MathTemplatedConfiguration;
  private _disableSidePanel?: boolean;

  static prepareModel = (model: AuthorModel = {}): AuthorModel => {
    const { validationDefault, allowTrailingZerosDefault, ignoreOrderDefault, responses = {} } = model;

    const updatedResponses = Object.keys(responses).reduce<Record<string, MathTemplatedResponse>>((acc, responseId) => {
      const correctResponse = responses[responseId];

      acc[responseId] = {
        ...correctResponse,
        validation: correctResponse.validation || validationDefault,
        allowTrailingZeros: correctResponse.allowTrailingZeros || allowTrailingZerosDefault,
        ignoreOrder: correctResponse.ignoreOrder || ignoreOrderDefault,
      };

      return acc;
    }, {});

    const joinedObj = {
      ...sensibleDefaults.model,
      ...model,
      responses: updatedResponses,
    };

    const slateMarkup = joinedObj.slateMarkup || createSlateMarkup(joinedObj.markup, joinedObj.responses);
    const processedMarkup = processMarkup(slateMarkup);

    // this was added to treat an exception, when the model has responses without the "answer" property
    if (joinedObj.responses) {
      Object.keys(joinedObj.responses).forEach((key) => {
        // Older models can hold an array of responses per response area.
        const legacyResponses = joinedObj.responses[key] as unknown as Array<Partial<MathTemplatedResponse>>;

        if (isArray(legacyResponses)) {
          joinedObj.responses[key] = (legacyResponses || []).map((item, index) => {
            if (!item.answer) {
              log('Choice does not contain "answer" property, which is required.', item);
              return { answer: `${index}`, ...item };
            }

            return item;
          }) as unknown as MathTemplatedResponse;
        }
      });
    }

    return {
      ...joinedObj,
      slateMarkup,
      markup: processedMarkup,
    };
  };

  constructor() {
    super();
    this._root = null;
    this._model = MathTemplateConfigure.prepareModel();
    this._configuration = sensibleDefaults.configuration;
    this.onModelChanged = this.onModelChanged.bind(this);
    this.onConfigurationChanged = this.onConfigurationChanged.bind(this);
  }

  set model(s: AuthorModel) {
    this._model = MathTemplateConfigure.prepareModel(s);
    this._render();
  }

  set configuration(c: MathTemplatedConfiguration) {
    this._configuration = defaults(c, sensibleDefaults.configuration);

    // if language:enabled is true, then the corresponding default item model should include a language value;
    // if it is false, then the language field should be omitted from the item model.
    // if a default item model includes a language value (e.g., en_US) and the corresponding authoring view settings have language:settings = true,
    // then (a) language:enabled should also be true, and (b) that default language value should be represented in languageChoices[] (as a key).
    if (c.language?.enabled) {
      if (c.languageChoices?.options?.length) {
        this._model.language = c.languageChoices.options[0].value;
      }
    } else if ((c.language as NonNullable<MathTemplatedConfiguration['language']>).settings && this._model.language) {
      // `defaults()` fills `c` in place, so `language` and `languageChoices` are set here.
      const language = this._configuration.language as NonNullable<MathTemplatedConfiguration['language']>;
      const languageChoices = this._configuration.languageChoices as NonNullable<
        MathTemplatedConfiguration['languageChoices']
      >;
      const modelLanguage = this._model.language;

      language.enabled = true;

      if (!languageChoices.options || !languageChoices.options.length) {
        languageChoices.options = [];
      }

      // check if the language is already included in the languageChoices.options array
      // and if not, then add it.
      if (!languageChoices.options.find((option) => option.value === modelLanguage)) {
        languageChoices.options.push({
          value: modelLanguage,
          label: modelLanguage,
        });
      }
    } else {
      delete this._model.language;
    }

    this._render();
  }

  set disableSidePanel(s: boolean) {
    this._disableSidePanel = s;
    this._render();
  }

  dispatchModelUpdated(reset?: boolean) {
    const resetValue = !!reset;

    this.dispatchEvent(new ModelUpdatedEvent(this._model, resetValue));
  }

  onModelChanged(m: AuthorModel, reset?: boolean) {
    this._model = MathTemplateConfigure.prepareModel(m);
    this._render();
    this.dispatchModelUpdated(reset);
  }

  onConfigurationChanged(c: MathTemplatedConfiguration) {
    this._configuration = c;
    this._render();
  }

  /** @param {done, progress, file} handler */
  insertImage(handler: ImageHandler) {
    this.dispatchEvent(new InsertImageEvent(handler));
  }

  onDeleteImage(src: string, done: DeleteDone) {
    this.dispatchEvent(new DeleteImageEvent(src, done));
  }

  insertSound(handler: SoundHandler) {
    this.dispatchEvent(new InsertSoundEvent(handler));
  }

  onDeleteSound(src: string, done: DeleteDone) {
    this.dispatchEvent(new DeleteSoundEvent(src, done));
  }

  _render() {
    log('_render');

    let element = React.createElement(Main, {
      model: this._model,
      configuration: this._configuration,
      onModelChanged: this.onModelChanged,
      onConfigurationChanged: this.onConfigurationChanged,
      disableSidePanel: this._disableSidePanel,
      imageSupport: {
        add: this.insertImage.bind(this),
        delete: this.onDeleteImage.bind(this),
      },
      uploadSoundSupport: {
        add: this.insertSound.bind(this),
        delete: this.onDeleteSound.bind(this),
      },
    });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(element);
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
