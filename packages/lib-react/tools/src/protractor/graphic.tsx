// @ts-nocheck
/**
 * @synced-from pie-lib/packages/tools/src/protractor/graphic.jsx
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
import { range } from 'lodash-es';
import { strokeColor, noSelect } from '../style-utils';

const StyledLine: any = styled('line')(({ theme }) => ({
  strokeWidth: '0.2',
  stroke: strokeColor(theme),
}));

const Line = ({ angle, major, minor }) => (
  <StyledLine
    transform={`rotate(${angle}, 50.5,50)`}
    style={{}}
    x1="1"
    x2={major ? 10 : minor ? 6 : 3}
    y1="50"
    y2="50"
  />
);

const StyledSpikeLine: any = styled('line')(({ theme }) => ({
  strokeWidth: '0.2',
  stroke: strokeColor(theme),
}));

const Spike = ({ angle }) => (
  <StyledSpikeLine transform={`rotate(${angle}, 50.5,50)`} style={{}} x1="15" x2={'46'} y1="50" y2="50" />
);

const StyledText: any = styled('text')(({ theme }) => ({
  fontSize: '2.5px',
  textAnchor: 'middle',
  fill: strokeColor(theme),
  ...noSelect(),
}));

const Text = ({ angle }) => (
  <StyledText transform={`rotate(${angle - 90}, 50.5, 50)`} x="50" y="12.5">
    {angle}
  </StyledText>
);

const StyledPath: any = styled('path')(({ theme }) => ({
  strokeWidth: '0.2',
  stroke: strokeColor(theme),
}));

const StyledGraphicLine: any = styled('line')(({ theme }) => ({
  strokeWidth: '0.2',
  stroke: strokeColor(theme),
}));

const StyledCircle: any = styled('circle')(({ theme }) => ({
  strokeWidth: '0.2',
  stroke: strokeColor(theme),
  fill: 'none',
}));

export class Graphic extends React.PureComponent {
  render() {
    return (
      <svg viewBox="0 0 102 61">
        <StyledPath d="M 1,50 A 1,1 0 0 1 100,50 L 100,60 L 1,60 Z" fill="none" />
        {range(0, 181).map((r) => (
          <Line minor={r % 5 === 0} major={r % 10 === 0} angle={r} key={r} />
        ))}
        {range(0, 181, 10).map((r) => (
          <React.Fragment key={r}>
            <Spike angle={r} />
            <Text angle={r} />
          </React.Fragment>
        ))}
        <StyledCircle r="4" cx="50.5" cy="50" />
        <StyledGraphicLine x1="48.5" x2="52.5" y1="50" y2="50" />
        <StyledGraphicLine transform={'rotate(90 50.5 50)'} x1="48.5" x2="52.5" y1="50" y2="50" />
      </svg>
    );
  }
}

export default Graphic;
