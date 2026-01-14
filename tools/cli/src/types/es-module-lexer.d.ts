declare module 'es-module-lexer' {
  export const init: Promise<void>;
  export function parse(source: string): [Array<{ s: number; e: number }>, unknown];
}
