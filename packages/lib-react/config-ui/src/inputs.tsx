// @ts-nocheck

import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import { color, InputContainer as InputContainerImport } from '@pie-lib/render-ui';

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
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
const InputContainer = unwrapReactInteropSymbol(InputContainerImport, 'InputContainer') || unwrapReactInteropSymbol(renderUi.InputContainer, 'InputContainer');
import PropTypes from 'prop-types';
import React from 'react';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';

const InputTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  ariaLabel: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.string,
};

const StyledSwitch: any = styled(Switch)(() => ({
  justifyContent: 'inherit',
  transform: 'translate(-20%, 20%)',
}));

const InputSwitch = ({ className, label, ariaLabel = '', checked, onChange }) => {
  return (
    <InputContainer className={className} label={label}>
      <StyledSwitch checked={checked} onChange={onChange} slotProps={{ input: { 'aria-label': ariaLabel || label } }} />
    </InputContainer>
  );
};

InputSwitch.propTypes = { ...InputTypes };

const StyledCheckbox: any = styled(Checkbox)(({ theme, error }) => ({
  transform: 'translate(-25%, 20%)',
  color: `${color.tertiary()} !important`,
  ...(error && {
    color: `${theme.palette.error.main} !important`,
  }),
}));

const InputCheckbox = ({ className, label, ariaLabel = '', checked, onChange, disabled, error }) => {
  return (
    <InputContainer className={className} label={label}>
      <StyledCheckbox disabled={disabled} checked={checked} onChange={onChange} slotProps={{ input: { 'aria-label': ariaLabel || label } }} error={error} />
    </InputContainer>
  );
};

InputCheckbox.propTypes = { ...InputTypes };

const StyledRadio: any = styled(Radio)(({ theme, error }) => ({
  transform: 'translate(-20%, 20%)',
  color: `${color.tertiary()} !important`,
  ...(error && {
    color: `${theme.palette.error.main} !important`,
  }),
}));

const InputRadio = ({ className, label, ariaLabel = '', checked, onChange, disabled, error }) => {
  return (
    <InputContainer className={className} label={label}>
      <StyledRadio disabled={disabled} checked={checked} onChange={onChange} slotProps={{ input: { 'aria-label': ariaLabel || label } }} error={error} />
    </InputContainer>
  );
};

InputRadio.propTypes = { ...InputTypes };

export { InputSwitch, InputCheckbox, InputRadio };
