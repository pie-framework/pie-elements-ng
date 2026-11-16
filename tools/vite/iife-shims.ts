/**
 * Module source substituted for `debug` in per-element IIFE builds. Carries the
 * module-level `debug.log` and the instance methods element code calls.
 */
export const IIFE_DEBUG_SHIM_SOURCE =
  "const noop = () => {}; function debug() { const log = function () {}; log.enabled = false; log.log = noop; log.extend = () => log; log.destroy = noop; return log; } debug.log = noop; debug.enable = noop; debug.disable = () => ''; debug.enabled = () => false; export default debug;";

/**
 * Module source substituted for `prop-types` in per-element IIFE builds. It mirrors
 * prop-types' production shims: every validator is callable and carries `isRequired`,
 * so `PropTypes.oneOf([...]).isRequired` evaluates at module load.
 */
export const IIFE_PROP_TYPES_SHIM_SOURCE =
  'const shim = function () { return null; }; shim.isRequired = shim; const getShim = () => shim; export const array = shim, bigint = shim, bool = shim, func = shim, number = shim, object = shim, string = shim, symbol = shim, any = shim, element = shim, elementType = shim, node = shim; export const arrayOf = getShim, instanceOf = getShim, objectOf = getShim, oneOf = getShim, oneOfType = getShim, shape = getShim, exact = getShim; export const checkPropTypes = () => {}; export const resetWarningCache = () => {}; const types = { array, bigint, bool, func, number, object, string, symbol, any, element, elementType, node, arrayOf, instanceOf, objectOf, oneOf, oneOfType, shape, exact, checkPropTypes, resetWarningCache }; types.PropTypes = types; export { types as PropTypes }; export default types;';
