# MathQuill Extension Tests

This directory contains unit and integration tests for the MathQuill extensions.

## Test Files

### `setup.ts`
Test setup and mocking utilities for creating MathQuill test environments.

### `matrices.test.ts`
Comprehensive tests for the matrix implementation:
- MatrixCell behavior
- Matrix generation and HTML templates
- LaTeX parsing and generation
- Cell navigation and linking
- Row/column insertion
- Cell deletion and auto-cleanup
- Reflow and scaling calculations
- Keystroke handling

### `extensions.test.ts`
Tests for Khan, Learnosity, and PIE extensions:
- Learnosity: not-symbols (`\nless`, `\ngtr`)
- Learnosity: empty() method
- Learnosity: recurring decimal
- PIE: LRN exponent commands
- Khan: mobile keyboard (documentation)
- Khan: i18n ARIA
- Extension loading order
- CSS classes

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test matrices.test.ts

# Run tests with coverage (if configured)
bun test --coverage
```

## Test Coverage

Current test coverage focuses on:

### Matrix Implementation (High Priority)
- ✅ HTML template generation
- ✅ LaTeX parsing (delimiters, row/column splitting)
- ✅ LaTeX generation (proper formatting)
- ✅ Matrix type delimiters (all 5 types)
- ✅ Cell navigation logic
- ✅ Cell deletion logic
- ✅ Reflow calculations
- ✅ Block creation from templates
- ✅ Size limits enforcement
- ✅ Keystroke recognition

### Extensions (Medium Priority)
- ✅ Symbol definitions
- ✅ Command patterns
- ✅ Empty detection logic
- ✅ Extension loading order
- ✅ CSS class definitions

### Future Test Coverage
- [ ] Full DOM integration tests
- [ ] Cursor movement tests
- [ ] Event handler tests
- [ ] Browser-specific behavior
- [ ] Performance benchmarks

## Testing Approach

### Unit Tests
Unit tests verify individual functions and logic without requiring full MathQuill initialization:
- LaTeX string parsing
- HTML template generation
- Navigation calculations
- Scale factor computations
- Empty cell detection

### Integration Tests (Planned)
Future integration tests will verify full MathQuill behavior:
- Actual matrix creation in DOM
- Keyboard event handling
- Cursor navigation
- LaTeX round-trip (parse → render → serialize)

## Test Utilities

### `createMockMathQuill()`
Creates a minimal MathQuill mock for testing:
- Provides necessary MathQuill internals
- Mocks MathCommand and MathBlock classes
- Provides Parser API
- Includes NodeBase for DOM operations

### `setupDOM()`
Sets up DOM environment for tests:
- Creates document mock
- Provides element creation
- Mocks getComputedStyle

## Writing New Tests

When adding new tests:

1. **Import test framework**:
   ```typescript
   import { describe, it, expect, beforeEach } from 'bun:test';
   ```

2. **Use describe blocks** for grouping:
   ```typescript
   describe('Feature Name', () => {
     it('should do something', () => {
       expect(result).toBe(expected);
     });
   });
   ```

3. **Test edge cases**:
   - Empty inputs
   - Maximum/minimum values
   - Invalid inputs
   - Boundary conditions

4. **Keep tests focused**:
   - One assertion per test (when practical)
   - Clear test names
   - Minimal setup

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: bun test
```

## Debugging Tests

To debug failing tests:

1. Run specific test file:
   ```bash
   bun test matrices.test.ts
   ```

2. Add console.log statements:
   ```typescript
   it('should work', () => {
     console.log('Debug value:', value);
     expect(value).toBe(expected);
   });
   ```

3. Use Bun's built-in debugger:
   ```bash
   bun --inspect test
   ```

## Test Maintenance

- Update tests when implementation changes
- Keep mocks synchronized with real APIs
- Remove obsolete tests
- Add tests for bug fixes
- Document complex test scenarios
