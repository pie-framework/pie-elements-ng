// @ts-nocheck
/**
 * @synced-from pie-lib/packages/drag/src/uid-context.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';

const { Consumer, Provider } = React.createContext(-1);

export { Provider, Consumer };

export const generateId = () => (Math.random() * 1000001).toFixed(0);

export const withUid = (Component) => {
  const Wrapped = (props) => <Consumer>{(uid) => <Component {...props} uid={uid} />}</Consumer>;

  return Wrapped;
};
