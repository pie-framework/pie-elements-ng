import React from 'react';

export interface GraphContextValue {
  xScale?: ((value: number) => number) & { invert: (value: number) => number };
  snapValue?: (value: number) => number;
}

/** The graph's scale and snap functions, provided by `NumberLineGraph` to the ticks and elements it draws. */
export const GraphContext = React.createContext<GraphContextValue>({});
