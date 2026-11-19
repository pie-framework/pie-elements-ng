// @ts-nocheck

import { compact } from '@pie-element/shared-lodash';
import { isEmpty } from '@pie-element/shared-lodash';
import debug from 'debug';

const log = debug('@pie-lib:editable-html:plugins');
export const ALL_PLUGINS = [
  'bold',
  // 'code',
  'html',
  'extraCSSRules',
  'italic',
  'underline',
  'strikethrough',
  'bulleted-list',
  'numbered-list',
  'image',
  'math',
  'languageCharacters',
  'text-align',
  'blockquote',
  'h3',
  'table',
  'video',
  'audio',
  'responseArea',
  'redo',
  'undo',
  'superscript',
  'subscript',
];

export const PLUGINS_MAP = {
  'text-align': 'textAlign',
  'text-direction': 'textDirection',
  'bulleted-list': 'ul_list',
  'numbered-list': 'ol_list',
};

export const DEFAULT_PLUGINS = ALL_PLUGINS.filter((plug) => !['responseArea', 'h3', 'blockquote'].includes(plug));

export const buildExtensions = (activeExtensions, customExtensions, opts) => {
  log('[buildPlugins] opts: ', opts);

  activeExtensions = activeExtensions || DEFAULT_PLUGINS;

  const addIf = (key, shouldAdd = true) => activeExtensions.includes(key) && shouldAdd && key;

  const imagePlugin = opts.image && opts.image.delete;
  const mathPlugin = opts.math;
  const respAreaPlugin = opts.responseArea && opts.responseArea.type;
  const cssPlugin = !isEmpty(opts.extraCSSRules);

  const languageCharactersPlugins = opts?.languageCharacters || [];

  return compact([
    addIf('table'),
    addIf('bold'),
    // addIf('code', MarkHotkey({ key: '`', type: 'code', icon: <Code /> })),
    addIf('italic'),
    addIf('strikethrough'),
    addIf('underline'),
    // icon should be modifies accordingly
    addIf('superscript'),
    // icon should be modifies accordingly
    addIf('subscript'),
    addIf('image', !!imagePlugin),
    addIf('video'),
    addIf('audio'),
    addIf('math', !!mathPlugin),
    // The Spanish and special sets keep their positional `languageCharacters` entries; the Arabic
    // set is asked for by name.
    ...languageCharactersPlugins
      .filter((plugin) => plugin?.language !== 'arabic')
      .map((plugin) => addIf('languageCharacters', plugin)),
    languageCharactersPlugins.some((plugin) => plugin?.language === 'arabic') &&
      activeExtensions.includes('languageCharacters') &&
      'arabicCharacters',
    addIf('text-align'),
    addIf('text-direction'),
    addIf('blockquote'),
    addIf('h3'),
    addIf('bulleted-list'),
    addIf('numbered-list'),
    addIf('undo'),
    addIf('redo'),
    addIf('responseArea', !!respAreaPlugin),
    addIf('css', !!cssPlugin),
    addIf('html', !!opts.html),
  ]);
};
