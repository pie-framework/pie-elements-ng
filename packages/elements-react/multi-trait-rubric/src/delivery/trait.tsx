// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';
import { sanitizeModelHtml } from '@pie-element/shared-utils';
import { catalogs } from '../i18n/index.js';

const TraitName: any = styled('td')({
  color: color.primaryDark(),
  verticalAlign: 'middle',
});

const NoDescription: any = styled('div')({
  color: color.secondaryBackground(),
  textAlign: 'center',
});

const Trait = (props) => {
  const { trait, traitIndex, scaleIndex, showStandards, showDescription, scorePointsValues, language } = props;
  const { name, standards, scorePointsDescriptors, description } = trait || {};

  return (
    <tr key={`scale-${scaleIndex}-trait-${traitIndex}`}>
      <TraitName>
        <div dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(name) }} />
      </TraitName>

      {showStandards ? (
        <td>
          <div dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(standards.join(',')) }} />
        </td>
      ) : null}

      {showDescription ? (
        <td>
          <div dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(description) }} />
        </td>
      ) : null}

      {scorePointsValues &&
        scorePointsValues.map((scorePointValue, index) => {
          let scoreDescriptor;

          try {
            scoreDescriptor = scorePointsDescriptors[scorePointsValues.length - index - 1] || '';
          } catch (e) {
            scoreDescriptor = '';
          }

          return (
            <td key={`table-cell-${index}`}>
              {!scoreDescriptor ? (
                <NoDescription>{catalogs.forLocale(language).t('noDescription')}</NoDescription>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(scoreDescriptor) }} />
              )}
            </td>
          );
        })}
    </tr>
  );
};

Trait.propTypes = {
  language: PropTypes.string,
  showStandards: PropTypes.bool,
  showDescription: PropTypes.bool,
  scorePointsValues: PropTypes.arrayOf(PropTypes.number),
  scaleIndex: PropTypes.number,
  traitIndex: PropTypes.number,
  trait: PropTypes.shape({
    name: PropTypes.string,
    standards: PropTypes.arrayOf(PropTypes.string),
    scorePointsDescriptors: PropTypes.arrayOf(PropTypes.string),
    description: PropTypes.string,
  }),
};

export default Trait;
