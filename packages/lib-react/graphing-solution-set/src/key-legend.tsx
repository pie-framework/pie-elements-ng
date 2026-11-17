// @ts-nocheck

import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';
import { dynamicMessageKey } from '@pie-element/shared-i18n';
import { catalogs } from './i18n/index.js';
import { StyleSample } from './tools/shared/line-style-badge.js';

// The legend follows the theme, opaque white without one. Its swatches draw what the graph draws, with the
// same colours, discs and glyphs, so a student can match a mark to its row.
const StyledContainer: any = styled('div')(() => ({
  backgroundColor: color.v('pie')('background', color.defaults.WHITE),
  color: color.text(),
  padding: '20px',
  width: '355px',
  boxShadow: '0px 1px 5px 0px #9297A6',
}));

const StyledRow: any = styled('div')({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 10px',
});

const StyledTitle: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.h6.fontSize,
  marginLeft: '30px',
  fontWeight: '700',
  marginBottom: '10px',
}));

const StyledText: any = styled('div')({
  textAlign: 'right',
  marginRight: '10px',
  width: '175px',
  fontSize: '15px',
});

const Check = ({ x = 0, y = 0, stroke = 'white' }) => (
  <path d={`M${x + 4} ${y + 8.5} L${x + 7} ${y + 11.5} L${x + 12} ${y + 5}`} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
);
const Cross = ({ x = 0, y = 0, stroke = 'white' }) => (
  <path d={`M${x + 4.5} ${y + 4.5} L${x + 11.5} ${y + 11.5} M${x + 11.5} ${y + 4.5} L${x + 4.5} ${y + 11.5}`} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
);
const Corners = ({ x = 0, y = 0 }) => (
  <path
    d={`M${x + 4} ${y + 6.5} V${y + 4} H${x + 6.5} M${x + 9.5} ${y + 4} H${x + 12} V${y + 6.5} M${x + 12} ${y + 9.5} V${y + 12} H${x + 9.5} M${x + 6.5} ${y + 12} H${x + 4} V${y + 9.5}`}
    fill="none"
    stroke="white"
    strokeWidth="1.5"
  />
);

const Disc = ({ tone, children }) => (
  <>
    <circle cx="8" cy="8" r="8" fill={tone} />
    {children}
  </>
);

const lineSwatch = (tone, glyph, { dashed = false, thin = false } = {}) => (
  <svg width="77" height="16" viewBox="0 0 77 16" aria-hidden="true">
    <path d="M77 8 L15 8" stroke={tone} strokeWidth={thin ? 1 : 4} strokeDasharray={dashed ? '4 2' : undefined} />
    <Disc tone={tone}>{glyph}</Disc>
  </svg>
);

const badgeSwatch = (match) => (
  <svg width="78" height="24" viewBox="0 0 78 24" aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="75"
      height="21"
      rx="10.5"
      fill="white"
      stroke={color.defaults.PRIMARY_DARK}
      strokeWidth={match ? 1.5 : 3}
    />
    <StyleSample x={7} y={12} dashed={!match} />
    <text x="39" y="17" textAnchor="middle" fontSize="15" fontWeight="700" fill={color.defaults.PRIMARY_DARK}>
      {match ? '=' : '≠'}
    </text>
    <StyleSample x={50} y={12} dashed={false} />
  </svg>
);

const KeyLegend = ({ className, language }) => {
  // Re-renders once the language's catalog lands, for an element that did not preload it.
  const [, relabel] = useReducer((n) => n + 1, 0);
  const i18n = catalogs.forLocale(language, relabel);
  const t = (key) => i18n.t(dynamicMessageKey(`keyLegend.${key}`));
  const correct = color.correctWithIcon();
  const incorrect = color.incorrectWithIcon();
  const missing = color.missingWithIcon();

  const rows = [
    ['studentCorrect', lineSwatch(correct, <Check />)],
    ['studentIncorrect', lineSwatch(incorrect, <Cross />)],
    ['answerKeyCorrect', lineSwatch(missing, <Corners />, { thin: true, dashed: true })],
    ['lineStyleCorrect', badgeSwatch(true)],
    ['lineStyleIncorrect', badgeSwatch(false)],
  ];

  return (
    <StyledContainer className={className}>
      <StyledTitle>{i18n.t('key')}</StyledTitle>
      {rows.map(([key, swatch]) => (
        <StyledRow key={key}>
          <StyledText>{t(key)}</StyledText>
          {swatch}
        </StyledRow>
      ))}
    </StyledContainer>
  );
};

KeyLegend.propTypes = {
  className: PropTypes.string,
  language: PropTypes.string,
};

export default KeyLegend;
