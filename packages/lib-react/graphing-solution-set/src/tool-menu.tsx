// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { Button, Radio, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { createUniqueId } from '@pie-lib/render-ui';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

export class ToolMenu extends React.Component {
  static propTypes = {
    gssLineData: PropTypes.object,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    language: PropTypes.string,
  };

  // Each radio takes its accessible name from the visible line name beside it, and the radios
  // share a group name of their own, so a second item's menu is a separate group.
  idPrefix: string = createUniqueId('gss-tool-menu');

  onChangeRadioValue: any = (event) => {
    let { gssLineData, onChange } = this.props;
    let oldSelectedTool = gssLineData.selectedTool;
    gssLineData.selectedTool = event.target.value;
    onChange(gssLineData, oldSelectedTool);
  };

  lineTypeChange: any = (line, type) => {
    let { gssLineData, onChange } = this.props;
    let oldSelectedTool = gssLineData.selectedTool;
    gssLineData[`line${line}`].lineType = type;
    onChange(gssLineData, oldSelectedTool);
  };

  renderLineTypeButton(line, type, side) {
    const { gssLineData, disabled, language } = this.props;
    const selected = gssLineData[`line${line}`].lineType === type;
    const state = `${selected ? 'Selected' : 'UnSelected'}${disabled ? 'Disabled' : ''}`;
    return (
      <Button
        size="small"
        variant="contained"
        color={selected ? 'primary' : 'inherit'}
        disabled={!!disabled}
        aria-pressed={selected}
        onClick={() => this.lineTypeChange(line, type)}
        className={`lineTypeButton${side}${state}`}
      >
        {selected && <span aria-hidden="true">✔</span>} {translator.t(`graphing.${type.toLowerCase()}`, { lng: language })}
      </Button>
    );
  }

  renderToolRadio(value) {
    const { gssLineData, disabled, language } = this.props;
    return (
      <div className="radioFieldInner">
        <Radio
          name={`${this.idPrefix}-line`}
          onChange={this.onChangeRadioValue}
          value={value}
          disabled={!!disabled}
          checked={gssLineData.selectedTool === value}
          className="lineTypeRadio"
          inputProps={{ 'aria-labelledby': `${this.idPrefix}-${value}` }}
        />
        <Typography id={`${this.idPrefix}-${value}`} className="lineNameFont">
          {translator.t(`graphing.${value}`, { lng: language })}
        </Typography>
      </div>
    );
  }

  renderLine(line) {
    return (
      <div className="radioFieldOuter">
        {this.renderToolRadio(`line${line}`)}
        <div className="radioFieldButtons">
          {this.renderLineTypeButton(line, 'Solid', 'Left')}
          {this.renderLineTypeButton(line, 'Dashed', 'Right')}
        </div>
      </div>
    );
  }

  render() {
    const { gssLineData } = this.props;
    return (
      <Root>
        <div className="selectLineRadioGroup">
          {this.renderLine('A')}
          {gssLineData.numberOfLines === 2 && this.renderLine('B')}
          <div className="radioFieldOuter">{this.renderToolRadio('solutionSet')}</div>
        </div>
      </Root>
    );
  }
}

const Root: any = styled('div')(() => ({
  '& .selectLineRadioGroup': {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  '& .radioFieldOuter': {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'column',
  },
  '& .radioFieldInner': {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
  },
  '& .radioFieldButtons': {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    padding: '0 .9rem',
  },
  '& .lineNameFont': {
    fontWeight: 'bold',
    padding: '0 5px 0 0',
  },
  '& .lineTypeRadio': {
    color: '#000000 !important',
  },
  '& .lineTypeButtonLeftSelected': {
    textTransform: 'none',
    border: '1px solid #3E4EB1',
    backgroundColor: '#3E4EB1 !important',
    color: '#FFFFFF !important',
    borderRadius: '4px 0 0 4px',
  },
  '& .lineTypeButtonLeftUnSelected': {
    textTransform: 'none',
    border: '1px solid #3E4EB1',
    backgroundColor: '#FFFFFF !important',
    color: '#3E4EB1 !important',
    borderRadius: '4px 0 0 4px',
  },
  '& .lineTypeButtonRightSelected': {
    textTransform: 'none',
    border: '1px solid #3E4EB1',
    backgroundColor: '#3E4EB1 !important',
    color: '#FFFFFF !important',
    borderRadius: '0 4px 4px 0',
  },
  '& .lineTypeButtonRightUnSelected': {
    textTransform: 'none',
    border: '1px solid #3E4EB1',
    backgroundColor: '#FFFFFF !important',
    color: '#3E4EB1 !important',
    borderRadius: '0 4px 4px 0',
  },
  '& .lineTypeButtonLeftSelectedDisabled, & .lineTypeButtonRightSelectedDisabled': {
    backgroundColor: '#3E4EB1 !important',
    color: '#FFFFFF !important',
    cursor: 'default',
    pointerEvents: 'none',
  },
  '& .lineTypeButtonLeftUnSelectedDisabled, & .lineTypeButtonRightUnSelectedDisabled': {
    backgroundColor: '#FFFFFF !important',
    color: '#3E4EB1 !important',
    cursor: 'default',
    pointerEvents: 'none',
  },
}));

export default ToolMenu;
