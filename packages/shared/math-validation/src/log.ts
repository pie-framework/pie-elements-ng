import debug from 'debug';

const noop = () => {};

export const logger = (name: string): ((...args: unknown[]) => void) =>
  typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? debug(name) : noop;
