/**
 * LRN Exponent Commands (PIE)
 *
 * Source: PIE fork (2019)
 * File: src/legacy/mathquill-bundle.js lines 6082-6129
 *
 * Custom exponent notation for learning platforms.
 * Provides specialized exponent input formats.
 *
 * Commands:
 * - \lrnexponent{base}{exponent} - Custom exponent with base and power
 * - \lrnsquaredexponent{base} - Base with fixed ² exponent
 * - \lrnsubscript{base}{subscript} - Base with subscript
 */

import type { MathQuillInterface } from 'mathquill';

export function addLRNExponent(MQ: MathQuillInterface): void {
  const mqInternal = MQ as any;

  if (!mqInternal.L?.LatexCmds) {
    console.warn('MathQuill internals not accessible for LRN exponent');
    return;
  }

  const { LatexCmds, MathCommand, DOMView, h } = mqInternal.L;

  if (!MathCommand || !DOMView || !h) {
    console.warn('Required MathQuill internals not available');
    return;
  }

  // \lrnexponent{base}{exponent}
  if (!LatexCmds.lrnexponent) {
    LatexCmds.lrnexponent = class extends MathCommand {
      constructor() {
        super(
          '\\lrnexponent',
          new DOMView(2, (blocks: any[]) =>
            h('span', { class: 'mq-lrnexponent mq-non-leaf' }, [
              h('span', { class: 'mq-lrnplaceholder mq-non-leaf' }, [
                h.block('span', { class: 'mq-empty-box' }, blocks[0])
              ]),
              h('span', { class: 'mq-supsub mq-non-leaf mq-sup-only' }, [
                h('span', { class: 'mq-sup' }, [
                  h.block('span', { class: 'mq-empty-box' }, blocks[1])
                ])
              ])
            ])
          )
        );
      }

      latexRecursive(ctx: any) {
        this.checkCursorContextOpen(ctx);
        const blocks = this.blocks!;
        const baseLatex = blocks[0].latex();
        let expLatex = blocks[1].latex();
        
        if (expLatex.length > 1) {
          expLatex = '{' + expLatex + '}';
        } else if (expLatex.length === 0) {
          expLatex = '{ }';
        }
        
        ctx.uncleanedLatex += baseLatex + '^' + expLatex;
        this.checkCursorContextClose(ctx);
      }
    };
  }

  // \lrnsquaredexponent{base} - Fixed ² exponent
  if (!LatexCmds.lrnsquaredexponent) {
    LatexCmds.lrnsquaredexponent = class extends MathCommand {
      constructor() {
        super(
          '\\lrnsquaredexponent',
          new DOMView(1, (blocks: any[]) =>
            h('span', { class: 'mq-lrnexponent mq-non-leaf' }, [
              h('span', { class: 'mq-lrnplaceholder mq-non-leaf' }, [
                h.block('span', { class: 'mq-empty-box' }, blocks[0])
              ]),
              h('span', { class: 'mq-supsub mq-non-leaf mq-sup-only' }, [
                h('span', { class: 'mq-sup' }, [
                  h('span', { class: 'mq-empty-box' }, [h.text('2')])
                ])
              ])
            ])
          )
        );
      }

      latexRecursive(ctx: any) {
        this.checkCursorContextOpen(ctx);
        const baseLatex = this.blocks![0].latex();
        ctx.uncleanedLatex += baseLatex + '^2';
        this.checkCursorContextClose(ctx);
      }
    };
  }

  // \lrnsubscript{base}{subscript}
  if (!LatexCmds.lrnsubscript) {
    LatexCmds.lrnsubscript = class extends MathCommand {
      constructor() {
        super(
          '\\lrnsubscript',
          new DOMView(2, (blocks: any[]) =>
            h('span', { class: 'mq-lrnexponent mq-non-leaf' }, [
              h('span', { class: 'mq-lrnplaceholder mq-non-leaf' }, [
                h.block('span', { class: 'mq-empty-box' }, blocks[0])
              ]),
              h('span', { class: 'mq-supsub mq-non-leaf' }, [
                h('span', { class: 'mq-sub' }, [
                  h.block('span', { class: 'mq-empty-box' }, blocks[1])
                ]),
                h('span', { style: 'display:inline-block;width:0' }, [h.text('\u00A0')])
              ])
            ])
          )
        );
      }

      latexRecursive(ctx: any) {
        this.checkCursorContextOpen(ctx);
        const blocks = this.blocks!;
        const baseLatex = blocks[0].latex();
        const subLatex = blocks[1].latex();
        ctx.uncleanedLatex += baseLatex + '_' + subLatex;
        this.checkCursorContextClose(ctx);
      }
    };
  }
}
