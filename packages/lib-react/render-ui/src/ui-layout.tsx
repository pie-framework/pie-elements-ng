// @ts-nocheck

import React from 'react';
import { createTheme, styled, StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { createUniqueId } from './unique-id.js';

const theme = createTheme({
  typography: {
    fontFamily: 'inherit',
  },
  palette: {
    action: {
      disabled: 'rgba(0, 0, 0, 0.54);',
    },
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: { fontFamily: 'inherit' },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#e0e0e0',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#bdbdbd',
          },
        },
      },
    },
  },
});

const StyledContainer: any = styled('div')({
  // need this because some browsers set their own style on table
  '& table, th, td': {
    fontSize: 'inherit' /* Ensure table elements inherit font size */,
  },
});

class UiLayout extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.array,
    extraCSSRules: PropTypes.shape({
      names: PropTypes.arrayOf(PropTypes.string),
      rules: PropTypes.string,
    }),
    fontSizeFactor: PropTypes.number,
  };

  static defaultProps = {
    extraCSSRules: {},
    fontSizeFactor: 1,
  };

  constructor(props) {
    super(props);
    this.classesSheet = document.createElement('style');
  }

  // Every layout carries `extraCSSRules`, so the authored rules nest under a class only this layout
  // carries; one class keeps the specificity `.extraCSSRules` gave them. `extraCSSRules` stays as a
  // hook for authored CSS.
  scopeClass = createUniqueId('extra-css-rules');

  computeStyle(fontSizeFactor) {
    const getFontSize = (element) => parseFloat(getComputedStyle(element).fontSize);

    const rootFontSize = getFontSize(document.documentElement);
    const bodyFontSize = getFontSize(document.body);
    const effectiveFontSize = Math.max(rootFontSize, bodyFontSize);

    // Handle null, undefined, or invalid values by defaulting to 1
    const factor = fontSizeFactor != null && typeof fontSizeFactor === 'number' ? fontSizeFactor : 1;
    return factor !== 1 ? { fontSize: `${effectiveFontSize * factor}px` } : null;
  }

  render() {
    const { children, className, fontSizeFactor, ...rest } = this.props;

    const { extraCSSRules, ...restProps } = rest;
    const style = this.computeStyle(fontSizeFactor);

    return (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          {extraCSSRules?.rules ? (
            <style dangerouslySetInnerHTML={{ __html: `.${this.scopeClass} { ${extraCSSRules.rules} }` }} />
          ) : null}

          <StyledContainer
            className={`${className} extraCSSRules ${this.scopeClass}`}
            {...restProps}
            {...(style && { style })}
          >
            {children}
          </StyledContainer>
        </ThemeProvider>
      </StyledEngineProvider>
    );
  }
}

export default UiLayout;
