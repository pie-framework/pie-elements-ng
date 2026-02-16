/**
 * Test Setup
 *
 * Sets up the DOM environment and MathQuill instance for testing
 */

// Mock DOM environment for tests
if (typeof document === 'undefined') {
  // @ts-ignore - Bun provides global document in test environment
  global.document = {
    createElement: () => ({
      setAttribute: () => {},
      appendChild: () => {},
      classList: { add: () => {}, remove: () => {} },
      style: {},
      children: [],
    }),
    createDocumentFragment: () => ({
      appendChild: () => {},
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

if (typeof window === 'undefined') {
  // @ts-ignore
  global.window = {
    getComputedStyle: () => ({ fontSize: '16px' }),
  };
}

export const setupDOM = () => {
  // Additional DOM setup if needed
};

export const createMockMathQuill = () => {
  const mockMQ: any = {
    L: {
      LatexCmds: {},
      MathCommand: class {
        blocks: any[] = [];
        ends: any = { L: null, R: null };
        parent: any = null;
        setEnds(ends: any) {
          this.ends = ends;
        }
        checkCursorContextOpen(_ctx: any) {}
        checkCursorContextClose(_ctx: any) {}
        bubble(_event: string) {
          return this;
        }
        domFrag() {
          return {
            oneElement: () => null,
            firstChild: null,
          };
        }
      },
      MathBlock: class {
        blocks: any[] = [];
        ends: any = { L: null, R: null };
        parent: any = null;
        column: number = 0;
        row: number = 0;
        isEmpty() {
          return this.ends.L === null && this.ends.R === null;
        }
        adopt(_parent: any, _left: any, _right: any) {}
        keystroke(_key: string, _e: any, _ctrlr: any) {}
        deleteOutOf(_dir: any, _cursor: any) {}
        latex() {
          return '';
        }
        children() {
          return {
            adopt: (_block: any, _left: any, _right: any) => {},
          };
        }
        domFrag() {
          return {
            oneElement: () => null,
            firstChild: null,
          };
        }
      },
      Parser: {
        regex: (re: RegExp) => ({
          then: (fn: (content: string) => any) => fn(''),
        }),
        succeed: (val: any) => val,
      },
      DOMView: class {},
      h: () => ({}),
      L: 'L',
      R: 'R',
      latexMathParser: {
        parse: (_latex: string) => ({
          children: () => ({
            adopt: (_block: any, _left: any, _right: any) => {},
          }),
          latex: () => '',
        }),
      },
      NodeBase: {
        getNodeOfElement: (_el: any) => null,
        linkElementByBlockNode: (_el: any, _node: any) => {},
      },
    },
  };

  return mockMQ;
};
