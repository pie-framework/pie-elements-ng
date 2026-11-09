// @ts-nocheck

import PropTypes from 'prop-types';
import React from 'react';
import { styled } from '@mui/material/styles';

import Tile from './tile.js';
import { sanitizeModelHtml } from '@pie-element/shared-utils';
import {
  endOfSorted,
  endOfUnsorted,
  focusLabel,
  getCounts,
  readingInstructions,
  sortedHeading,
  sortedObjectPrefix,
  unsortedHeading,
  unsortedObjectPrefix,
} from './announcements.js';

const types = {
  choiceLabel: PropTypes.string,
  targetLabel: PropTypes.string,
  disabled: PropTypes.bool,
  tiles: PropTypes.array.isRequired,
  tileSize: PropTypes.string,
  addGuide: PropTypes.bool,
  // the translator the screen reader text is read in
  i18n: PropTypes.object.isRequired,
  selectedChoice: PropTypes.object,
  onChoiceClick: PropTypes.func,
  onPlacementClick: PropTypes.func,
};

const defaults = {
  tileSize: '1fr',
  disabled: false,
  addGuide: false,
};

// Text for screen readers only, read in the place it sits in the document.
export const ScreenReaderText: any = styled('span')({
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
});

// The tiles in document order are every choice, then every target. With placement areas, each is
// preceded or followed by the text a screen reader reads as it goes through the item (spec rows 2 to 7),
// and gets the label it announces on focus (rows 8, 9, 12 to 15).
const buildTiles = (props) => {
  const counts = props.includeTargets ? getCounts(props.tiles) : undefined;
  const firstChoice = props.tiles.findIndex((t) => t.type === 'choice');
  const firstTarget = props.tiles.findIndex((t) => t.type === 'target');
  const lastChoice = props.tiles.reduce((last, t, i) => (t.type === 'choice' ? i : last), -1);
  const lastTarget = props.tiles.length - 1;

  const T = (tile, index) => {
    tile.instanceId = props.instanceId;
    tile.disabled = props.disabled;
    tile.guideIndex = props.addGuide ? tile.index + 1 : undefined;
    // unique key for dnd-kit IDs
    tile.tileIndex = index;
    tile.selectedChoice = props.selectedChoice;
    tile.onChoiceClick = props.onChoiceClick;
    tile.onPlacementClick = props.onPlacementClick;

    if (props.includeTargets) {
      return (
        <React.Fragment key={index}>
          {/* the heading of the unsorted column is the choice label, which is read as it is */}
          {index === firstChoice && <ScreenReaderText>{unsortedHeading(props.i18n, undefined, counts)}</ScreenReaderText>}
          {/* the visible target label is hidden from screen readers, which read it here, in the order of the tiles */}
          {index === firstTarget && <ScreenReaderText>{sortedHeading(props.i18n, props.targetLabel, counts)}</ScreenReaderText>}
          {tile.type === 'choice' && !tile.empty && <ScreenReaderText>{unsortedObjectPrefix(props.i18n)}</ScreenReaderText>}
          {tile.type === 'target' && !tile.empty && (
            <ScreenReaderText>{sortedObjectPrefix(props.i18n, tile.index)}</ScreenReaderText>
          )}
          <Tile {...tile} ariaLabel={focusLabel(props.i18n, tile, props.selectedChoice, counts)} />
          {index === lastChoice && <ScreenReaderText>{endOfUnsorted(props.i18n)}</ScreenReaderText>}
          {index === lastTarget && <ScreenReaderText>{endOfSorted(props.i18n, props.disabled)}</ScreenReaderText>}
        </React.Fragment>
      );
    } else {
      return tile.type === 'choice' ? <Tile {...tile} key={index} /> : <Tile {...tile} label="" key={index} />;
    }
  };

  T.propTypes = { ...types };
  return T;
};

const StyledHTilerContainer: any = styled('div')(({ theme, includeTargets }) => ({
  display: 'grid',
  paddingBottom: theme.spacing(2),
  ...(includeTargets && {
    gridGap: '10px',
  }),
}));

const StyledChoiceLabel: any = styled('div')({
  textAlign: 'center',
});

const StyledTargetLabel: any = styled('div')({
  textAlign: 'center',
  gridRow: '3/4',
});

const StyledVTilerContainer: any = styled('div')(({ includeTargets }) => ({
  gridAutoFlow: 'column',
  display: 'grid',
  ...(includeTargets && {
    gridGap: '10px',
  }),
}));

const StyledVChoiceLabel: any = styled('div')({
  gridColumn: '1/2',
  textAlign: 'center',
});

const StyledVTargetLabel: any = styled('div')({
  gridColumn: '2/3',
  textAlign: 'center',
});

export class HorizontalTiler extends React.Component {
  static propTypes = { ...types };
  static defaultProps = { ...defaults };
  render() {
    const { includeTargets, choiceLabelEnabled, choiceLabel, targetLabel, tiles, tileSize, disabled, i18n } = this.props;

    const rows = includeTargets ? `auto ${tileSize} auto ${tileSize}` : `auto ${tileSize} auto`;
    const columns = includeTargets ? tiles.length / 2 : tiles.length;

    const style = {
      gridTemplateColumns: includeTargets
        ? `repeat(${columns}, ${tileSize})`
        : `auto repeat(${Math.floor(columns / 2) - 1}, ${tileSize} 10px) ${tileSize} auto`,
      gridTemplateRows: rows,
    };

    const labelStyle = {
      gridColumn: `1/${columns + 1}`,
    };

    return (
      <StyledHTilerContainer includeTargets={includeTargets} style={style}>
        {includeTargets && <ScreenReaderText>{readingInstructions(i18n, getCounts(tiles), disabled)}</ScreenReaderText>}
        <StyledChoiceLabel
          style={labelStyle}
          dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(choiceLabelEnabled ? choiceLabel : '') }}
        />
        {includeTargets && (
          <StyledTargetLabel
            aria-hidden="true"
            style={labelStyle}
            dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(targetLabel) }}
          />
        )}
        {tiles.map(buildTiles(this.props))}
      </StyledHTilerContainer>
    );
  }
}

export class VerticalTiler extends React.Component {
  static propTypes = { ...types };
  static defaultProps = { ...defaults };
  render() {
    const { includeTargets, choiceLabelEnabled, choiceLabel, targetLabel, tiles, tileSize, disabled, i18n } = this.props;

    const columns = includeTargets ? 2 : 1;
    const rows = includeTargets ? tiles.length / 2 : tiles.length;

    const style = {
      gridTemplateColumns: `repeat(${columns}, ${tileSize})`,
      gridTemplateRows: includeTargets
        ? `auto repeat(${rows}, ${tileSize})`
        : `auto auto repeat(${Math.floor(rows / 2) - 1}, ${tileSize} 10px) ${tileSize} auto`,
    };

    return (
      <StyledVTilerContainer includeTargets={includeTargets} style={style}>
        {includeTargets && <ScreenReaderText>{readingInstructions(i18n, getCounts(tiles), disabled)}</ScreenReaderText>}
        <StyledVChoiceLabel
          dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(choiceLabelEnabled ? choiceLabel : '') }}
        />

        {includeTargets && (
          <StyledVTargetLabel aria-hidden="true" dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(targetLabel) }} />
        )}
        {tiles.map(buildTiles(this.props))}
      </StyledVTilerContainer>
    );
  }
}
