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

export const EBSR_MULTIPLE_CHOICE_TAG = `ebsr-multiple-choice${ownerVersionSuffix}`;
export const EBSR_MULTIPLE_CHOICE_CONFIGURE_TAG = `ebsr-multiple-choice-configure${ownerVersionSuffix}`;
