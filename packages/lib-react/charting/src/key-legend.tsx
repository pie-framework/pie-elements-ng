// @ts-nocheck

import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import { color } from '@pie-lib/render-ui';
import { catalogs } from './i18n/index.js';

const StyledContainer: any = styled('div')(({ theme }) => ({
  // White keeps the legend opaque when no theme is set.
  backgroundColor: color.v('pie')('background', color.defaults.WHITE),
  color: color.text(),
  padding: theme.spacing(2),
  width: '355px',
  boxShadow: 'inset 0px 1px 5px 0px #9297A6',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}));

const StyledRow: any = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}));

const StyledTitle: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.h6.fontSize,
  fontWeight: '700',
}));

const StyledSmallText: any = styled('div')(() => ({
  marginLeft: '2px',
}));

const StyledCorrectIcon: any = styled(Check)(({ theme }) => ({
  backgroundColor: color.correct(),
  borderRadius: theme.spacing(2),
  color: color.defaults.WHITE,
}));

const StyledIncorrectIcon: any = styled(Close)(({ theme }) => ({
  backgroundColor: color.incorrectWithIcon(),
  borderRadius: theme.spacing(2),
  color: color.defaults.WHITE,
}));

const StyledLastRow: any = styled('div')(() => ({
  marginLeft: '3px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}));

const KeyLegend = ({ language }) => {
  // Re-renders once the language's catalog lands, for an element that did not preload it.
  const [, relabel] = useReducer((n) => n + 1, 0);
  const i18n = catalogs.forLocale(language, relabel);

  return (
    <StyledContainer>
      <StyledTitle>{i18n.t('key')}</StyledTitle>
      <StyledRow>
        <StyledIncorrectIcon />
        <div>{i18n.t('keyLegend.incorrectAnswer')}</div>
      </StyledRow>
      <StyledRow>
        <StyledCorrectIcon />
        <div>{i18n.t('keyLegend.correctAnswer')}</div>
      </StyledRow>
      <StyledLastRow>
        <StyledCorrectIcon fontSize={'small'} />
        <StyledSmallText>{i18n.t('keyLegend.correctKeyAnswer')}</StyledSmallText>
      </StyledLastRow>
    </StyledContainer>
  );
};

KeyLegend.propTypes = {
  language: PropTypes.string,
};

export default KeyLegend;
