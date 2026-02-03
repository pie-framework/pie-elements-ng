// @ts-nocheck
/**
 * @synced-from pie-elements/packages/multi-trait-rubric/src/trait.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';

const TraitName: any = styled('td')({
  color: color.primaryDark(),
  verticalAlign: 'middle',
});

const NoDescription: any = styled('div')({
  color: color.secondaryBackground(),
  textAlign: 'center',
});

const Trait = (props) => {
  const { trait, traitIndex, scaleIndex, showStandards, showDescription, scorePointsValues } = props;
  const { name, standards, scorePointsDescriptors, description } = trait || {};

  return (
    <tr key={`scale-${scaleIndex}-trait-${traitIndex}`}>
      <TraitName>
        <div dangerouslySetInnerHTML={{ __html: name }} />
      </TraitName>

      {showStandards ? (
        <td>
          <div dangerouslySetInnerHTML={{ __html: standards.join(',') }} />
        </td>
      ) : null}

      {showDescription ? (
        <td>
          <div dangerouslySetInnerHTML={{ __html: description }} />
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
                <NoDescription dangerouslySetInnerHTML={{ __html: 'No Description' }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: scoreDescriptor }} />
              )}
            </td>
          );
        })}
    </tr>
  );
};

Trait.propTypes = {
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
