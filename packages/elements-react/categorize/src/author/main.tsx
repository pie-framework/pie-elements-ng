import React from 'react';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import Design from './design/index.js';
import type { CategorizeValidationErrors } from '../controller/index.js';
import type { CategorizeConfiguration, CategorizeModel } from '../types.js';

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<CategorizeModel> & {
  errors?: CategorizeValidationErrors;
};

type MediaSupport<Handler> = {
  add: (handler: Handler) => void;
  delete: (src: string, done: DeleteDone) => void;
};

export type MainProps = {
  model: AuthorModel;
  configuration?: CategorizeConfiguration;
  onModelChanged: (model: AuthorModel) => void;
  onConfigurationChanged?: (configuration: CategorizeConfiguration) => void;
  imageSupport?: MediaSupport<ImageHandler>;
  uploadSoundSupport?: MediaSupport<SoundHandler>;
};

type DesignProps = {
  model: AuthorModel;
  configuration?: CategorizeConfiguration;
  title?: string;
  onChange: (model: AuthorModel) => void;
  onConfigurationChanged?: (configuration: CategorizeConfiguration) => void;
  imageSupport?: MediaSupport<ImageHandler>;
  uploadSoundSupport?: MediaSupport<SoundHandler>;
};

// Design is untyped (`@ts-nocheck`); its propTypes omit `title`, which Main has always passed.
const TypedDesign = Design as unknown as React.ComponentType<DesignProps>;

export class Main extends React.Component<MainProps> {
  render() {
    const { model, onModelChanged, configuration, onConfigurationChanged, imageSupport, uploadSoundSupport } =
      this.props;

    return (
      <TypedDesign
        imageSupport={imageSupport}
        uploadSoundSupport={uploadSoundSupport}
        title="Design"
        model={model}
        configuration={configuration}
        onChange={onModelChanged}
        onConfigurationChanged={onConfigurationChanged}
      />
    );
  }
}

export default Main;
