/**
 * PIE Fork Backports
 *
 * Backports selected runtime fixes from pie-framework/mathquill that were never
 * part of the published `mathquill@0.10.1` package.
 */

const PATCH_FLAG = '__pieForkBackportsApplied';
const EXTRA_SLASHES_REGEX = /[\\]{2,}/gm;

export function applyForkBackports(MQ: unknown): void {
  const mqInternal = MQ as any;
  const internals = mqInternal?.L;

  if (!internals) {
    return;
  }

  patchTextBlockReflow(internals);
  patchLatexSanitization(internals);
  patchScrollHorizGuard(internals);
}

function patchTextBlockReflow(internals: any): void {
  const textBlockProto = internals?.TextBlock?.prototype;
  const leftKey = internals?.L;

  if (!textBlockProto || typeof textBlockProto.write !== 'function') {
    return;
  }

  if (textBlockProto[PATCH_FLAG]) {
    return;
  }

  const originalWrite = textBlockProto.write;
  textBlockProto.write = function patchedWrite(cursor: any, ch: string) {
    const shouldReflowAfterWrite = ch !== '$' && leftKey !== undefined && !!cursor?.[leftKey];
    const result = originalWrite.call(this, cursor, ch);

    if (shouldReflowAfterWrite && typeof this?.bubble === 'function') {
      this.bubble('reflow');
    }

    return result;
  };

  textBlockProto[PATCH_FLAG] = true;
}

function patchLatexSanitization(internals: any): void {
  const controllerProto = internals?.Controller?.prototype;

  if (!controllerProto || typeof controllerProto.renderLatexMath !== 'function') {
    return;
  }

  if (controllerProto[`${PATCH_FLAG}_latex`]) {
    return;
  }

  const originalRenderLatexMath = controllerProto.renderLatexMath;
  controllerProto.renderLatexMath = function patchedRenderLatexMath(latex: any) {
    const normalizedLatex =
      typeof latex === 'string' ? latex.replace(EXTRA_SLASHES_REGEX, '\\') : latex;

    return originalRenderLatexMath.call(this, normalizedLatex);
  };

  controllerProto[`${PATCH_FLAG}_latex`] = true;
}

function patchScrollHorizGuard(internals: any): void {
  const controllerProto = internals?.Controller?.prototype;

  if (!controllerProto || typeof controllerProto.scrollHoriz !== 'function') {
    return;
  }

  if (controllerProto[`${PATCH_FLAG}_scroll`]) {
    return;
  }

  const originalScrollHoriz = controllerProto.scrollHoriz;
  controllerProto.scrollHoriz = function patchedScrollHoriz(...args: any[]) {
    const rootJQ = this?.root?.jQ;
    if (!rootJQ || typeof rootJQ.stop !== 'function') {
      return;
    }

    return originalScrollHoriz.apply(this, args);
  };

  controllerProto[`${PATCH_FLAG}_scroll`] = true;
}
