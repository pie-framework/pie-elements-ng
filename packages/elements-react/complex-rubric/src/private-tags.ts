declare const __PIE_PACKAGE_VERSION__: string | undefined;

const encodeVersionForTag = (version: string): string =>
  version
    .trim()
    .toLowerCase()
    .replace(/[.+]/g, '-')
    .replace(/[^0-9A-Za-z-]/g, '-')
    .replace(/-{2,}/g, '-');

const ownerVersion =
  typeof __PIE_PACKAGE_VERSION__ === 'string' && __PIE_PACKAGE_VERSION__.trim()
    ? __PIE_PACKAGE_VERSION__
    : 'local';
const ownerVersionSuffix = `--version-${encodeVersionForTag(ownerVersion)}`;

export const COMPLEX_RUBRIC_SIMPLE_TAG = `complex-rubric-simple${ownerVersionSuffix}`;
export const COMPLEX_RUBRIC_MULTI_TRAIT_TAG = `complex-rubric-multi-trait${ownerVersionSuffix}`;
export const COMPLEX_RUBRIC_SIMPLE_CONFIGURE_TAG = `rubric-configure${ownerVersionSuffix}`;
export const COMPLEX_RUBRIC_MULTI_TRAIT_CONFIGURE_TAG = `multi-trait-rubric-configure${ownerVersionSuffix}`;
