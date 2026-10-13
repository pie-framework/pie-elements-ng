// @ts-nocheck

import React from 'react';
import { styled } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { Select } from '@mui/material';
import PropTypes from 'prop-types';
import { useUniqueId } from '@pie-lib/render-ui';

const StyledContainer: any = styled('div')(() => ({
  width: '160px',
}));

const StyledFormControl: any = styled(FormControl)(() => ({
  width: '160px',
}));

const StyledInputLabel: any = styled(InputLabel)(() => ({
  backgroundColor: 'transparent',
}));

const ChartType = ({ onChange, value, availableChartTypes, chartTypeLabel }) => {
  const labelId = useUniqueId('chart-type-label');

  return (
    <StyledContainer>
      <StyledFormControl variant={'outlined'}>
        <StyledInputLabel id={labelId}>{chartTypeLabel}</StyledInputLabel>
        <Select
          labelId={labelId}
          id={`${labelId}-select`}
          name="chartType"
          value={value}
          onChange={onChange}
          label={chartTypeLabel}
          MenuProps={{ transitionDuration: { enter: 225, exit: 195 } }}
        >
          {availableChartTypes?.histogram && <MenuItem value={'histogram'}>{availableChartTypes.histogram}</MenuItem>}
          {availableChartTypes?.bar && <MenuItem value={'bar'}>{availableChartTypes.bar}</MenuItem>}
          {availableChartTypes?.lineDot && <MenuItem value={'lineDot'}>{availableChartTypes.lineDot}</MenuItem>}
          {availableChartTypes?.lineCross && <MenuItem value={'lineCross'}>{availableChartTypes.lineCross}</MenuItem>}
          {availableChartTypes?.dotPlot && <MenuItem value={'dotPlot'}>{availableChartTypes.dotPlot}</MenuItem>}
          {availableChartTypes?.linePlot && <MenuItem value={'linePlot'}>{availableChartTypes.linePlot}</MenuItem>}
        </Select>
      </StyledFormControl>
    </StyledContainer>
  );
};

ChartType.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  availableChartTypes: PropTypes.shape({
    histogram: PropTypes.string,
    bar: PropTypes.string,
    lineDot: PropTypes.string,
    lineCross: PropTypes.string,
    dotPlot: PropTypes.string,
    linePlot: PropTypes.string,
  }),
  chartTypeLabel: PropTypes.string,
};

export default ChartType;
