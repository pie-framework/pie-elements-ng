import jQuery from 'jquery';

if (typeof window !== 'undefined') {
  // MathQuill UMD reads these globals when the bundle is evaluated.
  (window as any).jQuery = (window as any).jQuery || jQuery;
  (window as any).$ = (window as any).$ || jQuery;
}
