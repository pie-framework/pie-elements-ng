// @ts-nocheck

import React, { useReducer } from 'react';
import { styled } from '@mui/material/styles';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import { color } from '@pie-lib/render-ui';
import { catalogs } from './i18n/index.js';

const rule = `1px solid ${color.v('pie')('border-light', 'lightgrey')}`;

const StyledFlexContainer: any = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(2),
  borderBottom: rule,
  borderTop: rule,
  paddingBottom: theme.spacing(1),
  paddingTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledKey: any = styled('span')(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 'bold',
  color: color.text(),
  marginLeft: theme.spacing(1),
}));

const StyledContainer: any = styled('div')(() => ({
  position: 'relative',
  padding: '4px',
  fontSize: '14px',
  borderRadius: '4px',
}));

const StyledCorrectContainer: any = styled(StyledContainer)(() => ({
  border: `${color.correctTertiary()} solid 2px`,
}));

const StyledIncorrectContainer: any = styled(StyledContainer)(() => ({
  border: `${color.incorrectWithIcon()} solid 2px`,
}));

const StyledMissingContainer: any = styled(StyledContainer)(() => ({
  border: `${color.incorrectWithIcon()} dashed 2px`,
}));

const baseIconStyles = {
  color: color.white(),
  position: 'absolute',
  top: '-8px',
  left: '-8px',
  borderRadius: '50%',
  fontSize: '12px',
  padding: '2px',
};

const StyledCorrectCheckIcon: any = styled(Check)(() => ({
  ...baseIconStyles,
  backgroundColor: color.correctTertiary(),
}));

const StyledIncorrectCloseIcon: any = styled(Close)(() => ({
  ...baseIconStyles,
  backgroundColor: color.incorrectWithIcon(),
}));

export const Legend = ({ language, showOnlyCorrect }) => {
  // Re-renders once the language's catalog lands, for an element that did not preload it.
  const [, relabel] = useReducer((n) => n + 1, 0);
  const i18n = catalogs.forLocale(language, relabel);
  const legendItems = [
    {
      Icon: StyledCorrectCheckIcon,
      label: i18n.t('correctAnswerSelected'),
      Container: StyledCorrectContainer,
    },
    {
      Icon: StyledIncorrectCloseIcon,
      label: i18n.t('incorrectSelection'),
      Container: StyledIncorrectContainer,
    },
    {
      Icon: StyledIncorrectCloseIcon,
      label: i18n.t('correctAnswerNotSelected'),
      Container: StyledMissingContainer,
    },
  ];

  if (showOnlyCorrect) {
    legendItems.splice(1, 2);
  }

  return (
    <StyledFlexContainer>
      <StyledKey>{i18n.t('key')}</StyledKey>
      {legendItems.map(({ Icon, label, Container }, idx) => (
        <Container key={idx}>
          <Icon />
          <span>{label}</span>
        </Container>
      ))}
    </StyledFlexContainer>
  );
};
