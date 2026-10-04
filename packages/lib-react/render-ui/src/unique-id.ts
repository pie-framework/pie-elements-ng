import React from 'react';

// Random rather than a module counter or React.useId: each element bundle carries its own copy
// of this module, and IIFE bundles their own React, so both counters restart per bundle and
// repeat when items share a page.
export const createUniqueId = (prefix: string): string => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

// Creates the id once per component instance and keeps it across re-renders.
export const useUniqueId = (prefix: string): string => React.useState(() => createUniqueId(prefix))[0];
