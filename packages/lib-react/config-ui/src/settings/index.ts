// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/settings/index.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Panel from './panel';

export { Panel };

export const textField = (label, isConfigProperty = true) => ({
  label,
  type: 'textField',
  isConfigProperty,
});

export const toggle = (label, isConfigProperty = false, disabled = false) => ({
  type: 'toggle',
  label,
  isConfigProperty,
  disabled,
});

const toChoice = (opt) => {
  if (typeof opt === 'string') {
    return { label: opt, value: opt };
  } else {
    return opt;
  }
};

export const radio = function() {
  const args = Array.prototype.slice.call(arguments);
  const [label, choices, isConfigProperty = false] = args;

  return {
    type: 'radio',
    label,
    choices: choices && choices.map((o) => toChoice(o)),
    isConfigProperty,
  };
};

export const dropdown = (label, choices, isConfigProperty = false) => {
  return {
    type: 'dropdown',
    label,
    choices,
    isConfigProperty,
  };
};

export const numberField = (label, options, isConfigProperty = false) => ({
  ...options,
  label,
  type: 'numberField',
  isConfigProperty,
});

export const numberFields = (label, fields, isConfigProperty = false) => {
  Object.keys(fields).map((key) => {
    fields[key] = numberField(fields[key].label, fields[key], isConfigProperty);
  });

  return {
    type: 'numberFields',
    label,
    fields,
  };
};

export const checkbox = (label, settings, isConfigProperty = false) => ({
  ...settings,
  label,
  type: 'checkbox',
  isConfigProperty,
});

export const checkboxes = (label, choices, isConfigProperty = false) => {
  Object.keys(choices).map((key) => {
    choices[key] = checkbox(choices[key].label, choices[key], isConfigProperty);
  });

  return {
    type: 'checkboxes',
    label,
    choices,
  };
};
