// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/two-choice.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { InputContainer as InputContainerImport } from '@pie-lib/render-ui';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
const InputContainer = unwrapReactInteropSymbol(InputContainerImport, 'InputContainer');
import PropTypes from 'prop-types';
import RadioWithLabel from './radio-with-label.js';
import React from 'react';
import { styled } from '@mui/material/styles';

const StyledGroup: any = styled('div')(({ theme, direction }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  paddingLeft: 0,
  marginTop: theme.spacing(1),
  ...(direction === 'vertical' && {
    flexDirection: 'column',
  }),
}));

class NChoice extends React.Component {
  static propTypes = {
    header: PropTypes.string.isRequired,
    className: PropTypes.string,
    customLabel: PropTypes.func,
    opts: PropTypes.array.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    direction: PropTypes.oneOf(['horizontal', 'vertical']),
  };

  handleChange: any = (event) => {
    this.props.onChange(event.currentTarget.value);
  };

  render() {
    const { header, className, customLabel, opts, value, direction } = this.props;

    const preppedOpts = opts.map((o) => {
      return typeof o === 'string' ? { label: o, value: o } : o;
    });
    const LabelComponent = customLabel || RadioWithLabel;

    return (
      <InputContainer label={header} className={className}>
        <StyledGroup direction={direction}>
          {preppedOpts.map((o, index) => (
            <LabelComponent
              value={o.value}
              key={index}
              checked={o.value === value}
              onChange={this.handleChange}
              label={o.label}
            />
          ))}
        </StyledGroup>
      </InputContainer>
    );
  }
}

export { NChoice };

const labelValue = PropTypes.shape({ label: PropTypes.string, value: PropTypes.string });

class TwoChoice extends React.Component {
  static propTypes = {
    header: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    one: PropTypes.oneOfType([labelValue, PropTypes.string]),
    two: PropTypes.oneOfType([labelValue, PropTypes.string]),
    className: PropTypes.string,
    customLabel: PropTypes.func,
  };

  render() {
    const { one, two, header, className, customLabel, value, onChange } = this.props;
    const opts = [one, two];

    return (
      <NChoice
        customLabel={customLabel}
        header={header}
        className={className}
        opts={opts}
        value={value}
        onChange={onChange}
      />
    );
  }
}

export default TwoChoice;
