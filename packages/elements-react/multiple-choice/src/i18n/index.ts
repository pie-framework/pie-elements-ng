import { defineCatalogs } from '@pie-element/shared-i18n';
import enUS from './en-US.js';

export const catalogs = defineCatalogs({
  packageName: '@pie-element/multiple-choice',
  source: enUS,
  loaders: {
    es: () => import(/* webpackMode: "eager" */ './es.js'),
    'th-TH': () => import(/* webpackMode: "eager" */ './th-TH.js'),
    'en-GB': () => import(/* webpackMode: "eager" */ './en-GB.js'),
    'en-AU': () => import(/* webpackMode: "eager" */ './en-AU.js'),
    fr: () => import(/* webpackMode: "eager" */ './fr.js'),
    ar: () => import(/* webpackMode: "eager" */ './ar.js'),
    pt: () => import(/* webpackMode: "eager" */ './pt.js'),
    ko: () => import(/* webpackMode: "eager" */ './ko.js'),
    ja: () => import(/* webpackMode: "eager" */ './ja.js'),
    zh: () => import(/* webpackMode: "eager" */ './zh.js'),
    cy: () => import(/* webpackMode: "eager" */ './cy.js'),
    sv: () => import(/* webpackMode: "eager" */ './sv.js'),
    'nl-NL': () => import(/* webpackMode: "eager" */ './nl-NL.js'),
  },
});
