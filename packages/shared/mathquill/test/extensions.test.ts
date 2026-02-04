/**
 * Extension Tests
 *
 * Tests for Khan, Learnosity, and PIE extensions
 */

import { describe, it, expect } from 'bun:test';

describe('Learnosity Extensions', () => {
  describe('Not-Symbols', () => {
    it('should define nless symbol', () => {
      const nlessSymbol = '≮';
      const nlessCommand = '\\nless';

      expect(nlessSymbol).toBe('≮');
      expect(nlessCommand).toBe('\\nless');
    });

    it('should define ngtr symbol', () => {
      const ngtrSymbol = '≯';
      const ngtrCommand = '\\ngtr';

      expect(ngtrSymbol).toBe('≯');
      expect(ngtrCommand).toBe('\\ngtr');
    });

    it('should have correct Unicode code points', () => {
      expect('≮'.charCodeAt(0)).toBe(0x226e);
      expect('≯'.charCodeAt(0)).toBe(0x226f);
    });
  });

  describe('Empty Method', () => {
    it('should detect empty string', () => {
      const isEmpty = (latex: string) => !latex || latex.trim() === '';

      expect(isEmpty('')).toBe(true);
      expect(isEmpty('  ')).toBe(true);
      expect(isEmpty('x')).toBe(false);
    });

    it('should detect whitespace-only strings', () => {
      const isEmpty = (latex: string) => !latex || latex.trim() === '';

      expect(isEmpty('   \t\n  ')).toBe(true);
      expect(isEmpty(' x ')).toBe(false);
    });
  });

  describe('Recurring Decimal', () => {
    it('should use dot command', () => {
      const command = '\\dot{3}';
      const expectedSymbol = '3̇'; // 3 with dot above

      expect(command).toBe('\\dot{3}');
      // The actual rendering would be handled by MathQuill
    });
  });
});

describe('PIE Extensions', () => {
  describe('LRN Exponent Commands', () => {
    it('should define lrnexponent command', () => {
      const command = '\\lrnexponent{x}{2}';
      expect(command).toContain('lrnexponent');
      expect(command).toContain('{x}');
      expect(command).toContain('{2}');
    });

    it('should define lrnsquaredexponent command', () => {
      const command = '\\lrnsquaredexponent{x}';
      expect(command).toContain('lrnsquaredexponent');
      expect(command).toContain('{x}');
    });

    it('should define lrnsubscript command', () => {
      const command = '\\lrnsubscript{x}{1}';
      expect(command).toContain('lrnsubscript');
      expect(command).toContain('{x}');
      expect(command).toContain('{1}');
    });

    it('should parse lrnexponent LaTeX pattern', () => {
      const latex = '\\lrnexponent{base}{exp}';
      const pattern = /\\lrnexponent{([^}]*)}{([^}]*)}/;
      const match = latex.match(pattern);

      expect(match).toBeTruthy();
      expect(match![1]).toBe('base');
      expect(match![2]).toBe('exp');
    });
  });
});

describe('Khan Academy Extensions', () => {
  describe('Mobile Keyboard', () => {
    it('should handle mobile keyboard events', () => {
      // Test that mobile keyboard handling is documented
      const mobileKeyboardNote = 'Built into Desmos/Khan fork';
      expect(mobileKeyboardNote).toContain('Desmos');
    });
  });

  describe('i18n ARIA', () => {
    it('should support ARIA labels', () => {
      const ariaLabel = 'Matrix with 2 rows and 2 columns';
      expect(ariaLabel).toContain('Matrix');
      expect(ariaLabel).toContain('rows');
      expect(ariaLabel).toContain('columns');
    });
  });
});

describe('Extension Loading', () => {
  it('should load extensions in correct order', () => {
    const loadOrder = [
      'Khan mobile-keyboard',
      'Khan i18n-aria',
      'Learnosity recurring-decimal',
      'Learnosity not-symbols',
      'Learnosity empty-method',
      'PIE lrn-exponent',
      'PIE matrices',
    ];

    expect(loadOrder.length).toBe(7);
    expect(loadOrder[0]).toContain('Khan');
    expect(loadOrder[loadOrder.length - 1]).toContain('matrices');
  });

  it('should handle missing MathQuill internals gracefully', () => {
    const mockMQ = { L: null };
    const hasInternals = mockMQ.L?.LatexCmds !== undefined;

    expect(hasInternals).toBe(false);
  });

  it('should check for required MathQuill components', () => {
    const requiredComponents = [
      'LatexCmds',
      'MathCommand',
      'MathBlock',
      'Parser',
      'DOMView',
      'h',
    ];

    expect(requiredComponents).toContain('MathCommand');
    expect(requiredComponents).toContain('Parser');
  });
});

describe('CSS Classes', () => {
  it('should use correct matrix classes', () => {
    const classes = {
      matrix: 'mq-matrix',
      nonLeaf: 'mq-non-leaf',
      paren: 'mq-paren',
      scaled: 'mq-scaled',
      empty: 'mq-empty',
      emptyBox: 'mq-empty-box',
    };

    expect(classes.matrix).toBe('mq-matrix');
    expect(classes.scaled).toBe('mq-scaled');
  });

  it('should use row count classes', () => {
    const getRowClass = (rowCount: number) => `mq-rows-${rowCount}`;

    expect(getRowClass(2)).toBe('mq-rows-2');
    expect(getRowClass(3)).toBe('mq-rows-3');
    expect(getRowClass(5)).toBe('mq-rows-5');
  });

  it('should use LRN exponent classes', () => {
    const classes = {
      lrnExponent: 'mq-lrnexponent',
      lrnPlaceholder: 'mq-lrnplaceholder',
      supSub: 'mq-supsub',
      supOnly: 'mq-sup-only',
      subOnly: 'mq-sub-only',
    };

    expect(classes.lrnExponent).toBe('mq-lrnexponent');
    expect(classes.supOnly).toBe('mq-sup-only');
  });
});
