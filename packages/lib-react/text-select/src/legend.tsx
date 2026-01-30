// @ts-nocheck
/**
 * @synced-from pie-lib/packages/text-select/src/legend.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import { color } from '@pie-lib/render-ui';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

const StyledFlexContainer: any = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(2),
  borderBottom: '1px solid lightgrey',
  borderTop: '1px solid lightgrey',
  paddingBottom: theme.spacing(1),
  paddingTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledKey: any = styled('span')(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 'bold',
  color: color.black(),
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
  const legendItems = [
    {
      Icon: StyledCorrectCheckIcon,
      label: translator.t('selectText.correctAnswerSelected', { lng: language }),
      Container: StyledCorrectContainer,
    },
    {
      Icon: StyledIncorrectCloseIcon,
      label: translator.t('selectText.incorrectSelection', { lng: language }),
      Container: StyledIncorrectContainer,
    },
    {
      Icon: StyledIncorrectCloseIcon,
      label: translator.t('selectText.correctAnswerNotSelected', { lng: language }),
      Container: StyledMissingContainer,
    },
  ];

  if (showOnlyCorrect) {
    legendItems.splice(1, 2);
  }

  return (
    <StyledFlexContainer>
      <StyledKey>{translator.t('selectText.key', { lng: language })}</StyledKey>
      {legendItems.map(({ Icon, label, Container }, idx) => (
        <Container key={idx}>
          <Icon />
          <span>{label}</span>
        </Container>
      ))}
    </StyledFlexContainer>
  );
};
