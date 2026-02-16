import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

export { Fragment, jsx, jsxs };

// Compatibility shim for libraries compiled with jsxDEV calls.
// We map jsxDEV to the production-safe jsx/jsxs runtime.
export function jsxDEV(type, props, key) {
  if (props && Array.isArray(props.children)) {
    return jsxs(type, props, key);
  }
  return jsx(type, props, key);
}
