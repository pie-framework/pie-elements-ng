import { defineCatalogs } from '@pie-element/shared-i18n';
import enUS from './en-US.js';

export const catalogs = defineCatalogs({
  packageName: '@pie-element/multiple-choice',
  source: enUS,
  loaders: {
    es: () => import(/* webpackMode: "eager" */ './es.js'),
  },
});
