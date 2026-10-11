import React from 'react';
import type MultiTraitRubricAuthorElement from '@pie-element/multi-trait-rubric/author';
import type RubricAuthorElement from '@pie-element/rubric/author';
import { RUBRIC_TYPES } from '@pie-lib/rubric';
import { layout } from '@pie-lib/config-ui';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';
import {
  COMPLEX_RUBRIC_MULTI_TRAIT_CONFIGURE_TAG,
  COMPLEX_RUBRIC_SIMPLE_CONFIGURE_TAG,
} from '../private-tags.js';
import type { ComplexRubricValidationErrors } from '../controller/index.js';
import type { ComplexRubricConfiguration, ComplexRubricModel, RubricModels, RubricType } from '../types.js';

/** The model the author edits: the defaults supply every rubric; a host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<ComplexRubricModel> & {
  rubrics: Required<RubricModels>;
  errors?: ComplexRubricValidationErrors;
};

/** The configuration the author renders: the defaults supply the rubric options and each rubric's configuration. */
export type AuthorConfiguration = ComplexRubricConfiguration &
  Required<Pick<ComplexRubricConfiguration, 'rubricOptions' | 'simpleRubric' | 'multiTraitRubric' | 'rubricless'>>;

export type MainProps = {
  canUpdateModel?: boolean;
  configuration: AuthorConfiguration;
  multiTraitRubricTagName?: string;
  model: AuthorModel;
  onModelChanged: (model: AuthorModel) => void;
  onConfigurationChanged: (configuration: ComplexRubricConfiguration) => void;
  simpleRubricTagName?: string;
};

/** A rubric author custom element rendered by its tag name; the ref hands Main the element to set its model and configuration on. */
type ConfigureElementTag<E extends HTMLElement> = React.ComponentType<{
  'data-rubric-type': RubricType;
  ref: (element: E | null) => void;
}>;

const StyledFormControlLabel: any = styled(FormControlLabel)({
  '&.MuiFormControlLabel-root': {
    width: 'fit-content',
    paddingRight: '24px',
    boxSizing: 'border-box',
    '&:hover': {
      background: 'var(--pie-secondary-background, rgba(241,241,241,1))',
    },
  },
});

const StyledRadio: any = styled(Radio)({
  '&.MuiRadio-root': {
    color: `${color.tertiary()} !important`,
  },
});

const rubricLabels = {
  [RUBRIC_TYPES.MULTI_TRAIT_RUBRIC]: 'Multi Trait Rubric',
  [RUBRIC_TYPES.SIMPLE_RUBRIC]: 'Simple Rubric',
  [RUBRIC_TYPES.RUBRICLESS]: 'Rubricless',
};

export class Main extends React.Component<MainProps> {
  declare simpleRubric: RubricAuthorElement | undefined;
  declare multiTraitRubric: MultiTraitRubricAuthorElement | undefined;
  declare rubricless: RubricAuthorElement | undefined;

  onModelChanged = (model: AuthorModel) => {
    const { onModelChanged } = this.props;

    return onModelChanged(model);
  };

  onChangeRubricType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { model } = this.props;

    const rubricType = e.target.value as RubricType;
    this.onModelChanged({ ...model, rubricType });
  };

  render() {
    const {
      model,
      configuration,
      canUpdateModel,
      multiTraitRubricTagName = COMPLEX_RUBRIC_MULTI_TRAIT_CONFIGURE_TAG,
      simpleRubricTagName = COMPLEX_RUBRIC_SIMPLE_CONFIGURE_TAG,
    } = this.props;
    const MultiTraitRubricConfigureElement =
      multiTraitRubricTagName as unknown as ConfigureElementTag<MultiTraitRubricAuthorElement>;
    const SimpleRubricConfigureElement = simpleRubricTagName as unknown as ConfigureElementTag<RubricAuthorElement>;

    const { extraCSSRules, rubrics = {} as AuthorModel['rubrics'] } = model || {};
    let { rubricType } = model;
    const {
      contentDimensions = {},
      rubricOptions = [],
      multiTraitRubric,
      simpleRubric,
      rubricless,
      width,
    } = configuration;
    let rubricTag: React.ReactNode = '';

    if (!rubricType) {
      rubricType = RUBRIC_TYPES.SIMPLE_RUBRIC as RubricType;
    }

    const isRubricTypeAvailable = rubricOptions.indexOf(rubricType) > -1;

    if (canUpdateModel) {
      switch (rubricType) {
        case RUBRIC_TYPES.SIMPLE_RUBRIC:
        default:
          rubricTag = (
            <SimpleRubricConfigureElement
              data-rubric-type="simpleRubric"
              key="simple-rubric"
              ref={(ref) => {
                if (ref) {
                  this.simpleRubric = ref;
                  this.simpleRubric.model = { ...rubrics.simpleRubric, errors: model.errors || {} };
                  this.simpleRubric.configuration = { ...simpleRubric, width };
                }
              }}
            />
          );
          break;

        case RUBRIC_TYPES.MULTI_TRAIT_RUBRIC:
          rubricTag = (
            <MultiTraitRubricConfigureElement
              data-rubric-type="multiTraitRubric"
              key="multi-trait-rubric"
              ref={(ref) => {
                if (ref) {
                  this.multiTraitRubric = ref;

                  this.multiTraitRubric.model = { ...rubrics.multiTraitRubric, errors: model.errors || {} };
                  this.multiTraitRubric.configuration = { ...multiTraitRubric, width: width || multiTraitRubric.width };
                }
              }}
            />
          );
          break;

        case RUBRIC_TYPES.RUBRICLESS:
          rubricTag = (
            <SimpleRubricConfigureElement
              data-rubric-type="rubricless"
              key="rubricless"
              ref={(ref) => {
                if (ref) {
                  this.rubricless = ref;

                  this.rubricless.model = rubrics.rubricless;
                  this.rubricless.configuration = { ...rubricless, width };
                }
              }}
            />
          );
          break;
      }
    }

    return (
      <layout.ConfigLayout
        extraCSSRules={extraCSSRules}
        dimensions={contentDimensions}
        hideSettings={true}
        settings={null}
      >
        <RadioGroup
          aria-label="rubric-type"
          name="rubricType"
          value={model.rubricType}
          onChange={this.onChangeRubricType}
        >
          {rubricOptions.length > 1 &&
            rubricOptions.map((availableRubric, i) => (
              <StyledFormControlLabel
                key={i}
                value={availableRubric}
                control={<StyledRadio checked={rubricType === availableRubric} />}
                label={rubricLabels[availableRubric]}
              />
            ))}
        </RadioGroup>

        {isRubricTypeAvailable && rubricTag}
      </layout.ConfigLayout>
    );
  }
}

export default Main;
