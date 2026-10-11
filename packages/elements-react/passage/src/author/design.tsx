import React from 'react';

import { settings, layout } from '@pie-lib/config-ui';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import type { ConfigureLanguageOptions } from '@pie-element/shared-types';

import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { ConfirmationDialog, PassageButton } from './common.js';
import Passage from './passage.js';
import type { PassageValidationErrors } from '../controller/index.js';
import type { PassageConfiguration, PassageEntry, PassageModel } from '../types.js';

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<PassageModel> & { passages: PassageEntry[]; errors?: PassageValidationErrors };

export type MainProps = {
  model: AuthorModel;
  configuration: PassageConfiguration;
  onModelChanged: (model: AuthorModel) => void;
  onConfigurationChanged: (configuration: PassageConfiguration) => void;
  imageSupport: {
    add: (handler: ImageHandler) => void;
    delete: (src: string, done: DeleteDone) => void;
  };
  uploadSoundSupport: {
    add: (handler: SoundHandler) => void;
    delete: (src: string, done: DeleteDone) => void;
  };
};

type MainState = { showConfirmationDialog: boolean; indexToRemove: number };

const { Panel, toggle, dropdown } = settings;

const AdditionalPassageHeading: any = styled(Typography)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export class Main extends React.Component<MainProps, MainState> {
  constructor(props: MainProps) {
    super(props);
    this.state = { showConfirmationDialog: false, indexToRemove: -1 };
  }

  getInnerText = (html: string) => (html || '').replaceAll(/<[^>]*>/g, '');

  onDelete = (model: AuthorModel, indexToRemove: number, onModelChanged: (model: AuthorModel) => void) => {
    let updatedPassages = model.passages;
    updatedPassages.splice(indexToRemove, 1);
    onModelChanged({ ...model, passages: updatedPassages });

    this.setState({
      showConfirmationDialog: false,
      indexToRemove: -1,
    });
  };

  removeAdditionalPassage = (indexToRemove: number) => {
    const { model, onModelChanged } = this.props;
    const { passages = [] } = model;

    const { teacherInstructions = '', title = '', subtitle = '', author = '', text = '' } = passages[indexToRemove];

    if (
      this.getInnerText(teacherInstructions).trim() ||
      this.getInnerText(title).trim() ||
      this.getInnerText(subtitle).trim() ||
      this.getInnerText(author).trim() ||
      this.getInnerText(text).trim()
    ) {
      this.setState({
        showConfirmationDialog: true,
        indexToRemove,
      });
    } else {
      this.onDelete(model, indexToRemove, onModelChanged);
    }
  };

  addAdditionalPassage = () => {
    const { model, onModelChanged } = this.props;

    const updatedPassages = [
      ...model.passages,
      {
        teacherInstructions: '',
        title: '',
        subtitle: '',
        author: '',
        text: '',
      },
    ];
    onModelChanged({ ...model, passages: updatedPassages });
  };

  render() {
    const { model, configuration, imageSupport, onConfigurationChanged, onModelChanged, uploadSoundSupport } =
      this.props;
    const {
      settingsPanelDisabled,
      language = {},
      languageChoices = {} as Partial<ConfigureLanguageOptions>,
      teacherInstructions = {},
      title = {},
      subtitle = {},
      text = {},
      author = {},
      additionalPassage = {},
    } = configuration || {};
    const { extraCSSRules, passages } = model || {};

    const panelSettings = {
      titleEnabled: title && title.settings && toggle(title.label),
      subtitleEnabled: subtitle && subtitle.settings && toggle(subtitle.label),
      authorEnabled: author && author.settings && toggle(author.label),
      textEnabled: text && text.settings && toggle(text.label),
      'additionalPassage.enabled':
        additionalPassage && additionalPassage.settings && toggle(additionalPassage.label, true),
    };

    const panelProperties = {
      teacherInstructionsEnabled:
        teacherInstructions && teacherInstructions.settings && toggle(teacherInstructions.label),
      'language.enabled': language && language.settings && toggle(language.label, true),
      language:
        language && language.settings && language.enabled && dropdown(languageChoices.label, languageChoices.options),
    };

    const confirmationDialogContent = `${additionalPassage.label} will be deleted`;

    const { indexToRemove, showConfirmationDialog } = this.state;

    return (
      <layout.ConfigLayout
        extraCSSRules={extraCSSRules}
        hideSettings={settingsPanelDisabled}
        settings={
          <Panel
            model={model}
            configuration={configuration}
            onChangeModel={(model) => onModelChanged(model)}
            onChangeConfiguration={(config) => onConfigurationChanged(config)}
            groups={{
              Settings: panelSettings,
              Properties: panelProperties,
            }}
          />
        }
      >
        {passages.map((_passage, passageIndex) => (
          <React.Fragment key={passageIndex}>
            {passageIndex > 0 && (
              <AdditionalPassageHeading variant="h5">
                {additionalPassage.label}
              </AdditionalPassageHeading>
            )}
            <Passage
              imageSupport={imageSupport}
              uploadSoundSupport={uploadSoundSupport}
              model={model}
              configuration={configuration}
              passageIndex={passageIndex}
              onModelChanged={onModelChanged}
            />
            {passageIndex > 0 && additionalPassage.enabled && (
              <PassageButton
                type={'remove'}
                label={`Remove ${additionalPassage.label}`}
                onClick={() => this.removeAdditionalPassage(passageIndex)}
              />
            )}
            {passageIndex === 0 && additionalPassage.enabled && passages.length < 2 && (
              <PassageButton label={`Add ${additionalPassage.label}`} onClick={this.addAdditionalPassage} />
            )}
          </React.Fragment>
        ))}
        <ConfirmationDialog
          open={showConfirmationDialog}
          title={'Warning'}
          content={confirmationDialogContent}
          cancel={'Cancel'}
          ok={'Ok'}
          onCancel={() =>
            this.setState({
              showConfirmationDialog: false,
            })
          }
          onOk={() => this.onDelete(model, indexToRemove, onModelChanged)}
        />
      </layout.ConfigLayout>
    );
  }
}

export default Main;
