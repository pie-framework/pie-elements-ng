// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/utils.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import _ from 'lodash-es';

export const mkSet = (category) => (o) => ({ ...o, category });

export const toArray = (o) => Object.keys(o).map((k) => o[k]);

export const toKey = (category) => (v) => {
  if (typeof v === 'string') {
    return {
      name: v,
      label: v,
      category,
      write: v,
    };
  } else {
    return {
      ...v,
      category,
    };
  }
};

export const transformToKeySetStructure = (data = []) => {
  const structure = [];

  _.times(5, () => {
    structure.push([]);
  });

  let ln = data.length;
  let i = 0;
  let j = 0;

  while (j < ln) {
    structure[i++].push(data[j++]);

    if (i === 5) {
      i = 0;
    }
  }

  return structure;
};

const latexAndNameDontExist = (base) => (k) => {
  const flattened = _.flatten(base);
  const latexExists = flattened.some((b) => b.latex === k.latex);
  const nameExists = flattened.some((b) => b.name === k.name);
  return !latexExists && !nameExists;
};

export const extendKeySet = (base = [], keySetData = []) => {
  keySetData = keySetData.filter(latexAndNameDontExist(base));

  const final = [];

  _.times(5 - base.length, () => {
    base.push([]);
  });
  _.times(5, () => {
    final.push([]);
  });

  const extra = transformToKeySetStructure(keySetData);

  for (let i = 0; i < 5; i++) {
    final[i] = [...base[i], ...extra[i]];
  }

  return final;
};
