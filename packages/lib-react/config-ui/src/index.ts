// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import AlertDialog from './alert-dialog.js';
import FeedbackConfig, { buildDefaults as feedbackConfigDefaults, FeedbackSelector } from './feedback-config/index.js';
import { InputCheckbox, InputRadio, InputSwitch } from './inputs.js';
import Langs, { LanguageControls } from './langs.js';
import Tabs from './tabs/index.js';
import Checkbox from './checkbox.js';
import FormSection from './form-section.js';
import Help from './help.js';
import Input from './input.js';
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
const InputContainer = unwrapReactInteropSymbol(InputContainerImport, 'InputContainer') || unwrapReactInteropSymbol(renderUi.InputContainer, 'InputContainer');
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
import NumberTextField from './number-text-field.js';
import NumberTextFieldCustom from './number-text-field-custom.js';
import TwoChoice, { NChoice } from './two-choice.js';
import TagsInput from './tags-input/index.js';
import MuiBox from './mui-box/index.js';
import ChoiceConfiguration from './choice-configuration/index.js';
import * as layout from './layout/index.js';

import * as choiceUtils from './choice-utils.js';
import withStatefulModel from './with-stateful-model.js';
import Toggle from './settings/toggle.js';
import DisplaySize from './settings/display-size.js';

import * as settings from './settings/index.js';

export {
  AlertDialog,
  FeedbackConfig,
  FeedbackSelector,
  feedbackConfigDefaults,
  InputCheckbox,
  InputSwitch,
  InputRadio,
  Langs,
  LanguageControls,
  Tabs,
  Checkbox,
  FormSection,
  Help,
  Input,
  InputContainer,
  NumberTextField,
  NumberTextFieldCustom,
  TwoChoice,
  NChoice,
  TagsInput,
  MuiBox,
  ChoiceConfiguration,
  layout,
  choiceUtils,
  withStatefulModel,
  Toggle,
  DisplaySize,
  settings,
};
