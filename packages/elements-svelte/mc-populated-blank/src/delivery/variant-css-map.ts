import selR1BaseCss from './cqt-css/sel-r1-base.css?raw';
import selR1PlusgggCss from './cqt-css/sel-r1-plusggg.css?raw';
import srVicCss from './cqt-css/sr-vic.css?raw';
import selVicCss from './cqt-css/sel-vic.css?raw';
import selR1GplusgggCss from './cqt-css/sel-r1-gplusggg.css?raw';
import selR1GStemCss from './cqt-css/sel-r1-g-stem.css?raw';
import selR1GgPlusCss from './cqt-css/sel-r1-gg-plus.css?raw';
import selR1GgplusCss from './cqt-css/sel-r1-ggplus.css?raw';
import selR1S3Css from './cqt-css/sel-r1-s3.css?raw';

export type VariantCssConfig = {
  variantId: string;
  variantClass: string;
  sourceUrl: string;
  cssText: string;
};

const VARIANT_BY_CUSTOM_TYPE: Record<string, VariantCssConfig> = {
  'sel_r1-_plusggg': {
    variantId: 'sel-r1-plusggg',
    variantClass: 'variant-sel-r1-plusggg',
    sourceUrl:
      'https://global-pr-ibvcustomfiles.renaissance-go.com/learnosity/sel_r1-_plusggg/0.0.1/question.css',
    cssText: selR1PlusgggCss,
  },
  'sr-vic': {
    variantId: 'sr-vic',
    variantClass: 'variant-sr-vic',
    sourceUrl:
      'https://global-pr-ibvcustomfiles.renaissance-go.com/learnosity/sr-vic/0.0.1/question.css',
    cssText: srVicCss,
  },
  sel_vic: {
    variantId: 'sel-vic',
    variantClass: 'variant-sel-vic',
    sourceUrl:
      'https://global-pr-ibvcustomfiles.renaissance-go.com/learnosity/sel_vic/0.0.1/question.css',
    cssText: selVicCss,
  },
  'sel_r1-_gplusggg': {
    variantId: 'sel-r1-gplusggg',
    variantClass: 'variant-sel-r1-gplusggg',
    sourceUrl:
      'https://global-pr-ibvcustomfiles.renaissance-go.com/learnosity/sel_r1-_gplusggg/0.0.1/question.css',
    cssText: selR1GplusgggCss,
  },
  'sel_r1-g_plusggg': {
    variantId: 'sel-r1-g-stem',
    variantClass: 'variant-sel-r1-g-stem',
    sourceUrl:
      'https://global-pr-ibvcustomfiles.renaissance-go.com/learnosity/sel_r1-g_plusggg/0.0.1/question.css',
    cssText: selR1GStemCss,
  },
  'sel_r1-gg_plusggg': {
    variantId: 'sel-r1-gg-plus',
    variantClass: 'variant-sel-r1-gg-plus',
    sourceUrl:
      'https://global-pr-ibvcustomfiles.renaissance-go.com/learnosity/sel_r1-gg_plusggg/0.0.1/question.css',
    cssText: selR1GgPlusCss,
  },
  'sel_r1-_ggplusggg': {
    variantId: 'sel-r1-ggplus',
    variantClass: 'variant-sel-r1-ggplus',
    sourceUrl:
      'https://global-pr-ibvcustomfiles.renaissance-go.com/learnosity/sel_r1-_ggplusggg/0.0.1/question.css',
    cssText: selR1GgplusCss,
  },
  'sel_r1-s3_plusggg': {
    variantId: 'sel-r1-s3',
    variantClass: 'variant-sel-r1-s3',
    sourceUrl:
      'https://global-pr-ibvcustomfiles.renaissance-go.com/learnosity/sel_r1-s3_plusggg/0.0.1/question.css',
    cssText: selR1S3Css,
  },
};

const normalizeCustomType = (value: unknown): string => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  // Accept both base custom types and version-suffixed tags like "...v0.0.1".
  return normalized.replace(/v\d+\.\d+\.\d+$/i, '');
};

export const getVariantCssConfig = (customType: unknown): VariantCssConfig | undefined => {
  const normalized = normalizeCustomType(customType);
  return VARIANT_BY_CUSTOM_TYPE[normalized];
};

export const getVariantRootClass = (customType: unknown): string => {
  return getVariantCssConfig(customType)?.variantClass || '';
};

const SEL_R1_VARIANT_IDS = new Set([
  'sel-r1-plusggg',
  'sel-r1-gplusggg',
  'sel-r1-g-stem',
  'sel-r1-gg-plus',
  'sel-r1-ggplus',
  'sel-r1-s3',
]);

const ROOT_SELECTOR = /\.mc-populated-blank-root(?![\w-])/g;

/** FNV-1a over the text, in base 36. */
const hashText = (text: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};

/**
 * Names this build's variant sheets. The sheets are global, so each selector is
 * narrowed to roots carrying the same key: two versions of the element on one
 * page then style only their own roots, and share a sheet only when the CSS is
 * identical.
 */
export const VARIANT_CSS_KEY = hashText(
  [selR1BaseCss, ...Object.values(VARIANT_BY_CUSTOM_TYPE).map((c) => c.cssText)].join('\n')
);

/** `:where()` adds no specificity, so the variant sheets cascade exactly as written. */
export const keyVariantCss = (cssText: string): string =>
  cssText.replace(
    ROOT_SELECTOR,
    `.mc-populated-blank-root:where([data-mpb-css="${VARIANT_CSS_KEY}"])`
  );

const injectStyleOnce = (target: Document | ShadowRoot, variantName: string, cssText: string) => {
  const id = `mc-populated-blank-css-${variantName}-${VARIANT_CSS_KEY}`;
  if (target.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.setAttribute('data-mpb-variant', variantName);
  style.textContent = keyVariantCss(cssText);
  (target instanceof ShadowRoot ? target : target.head).appendChild(style);
};

/**
 * Adds the item's variant sheet where `root` renders: the document head, or the
 * shadow root of a host that placed the element inside one, which document
 * styles do not reach.
 */
export const ensureVariantCssInjected = (config: VariantCssConfig | undefined, root: Element) => {
  if (!config?.cssText || typeof document === 'undefined') {
    return;
  }
  const rootNode = root.getRootNode();
  const target = rootNode instanceof ShadowRoot ? rootNode : document;
  if (SEL_R1_VARIANT_IDS.has(config.variantId)) {
    injectStyleOnce(target, 'sel-r1-base', selR1BaseCss);
  }
  injectStyleOnce(target, config.variantId, config.cssText);
};
