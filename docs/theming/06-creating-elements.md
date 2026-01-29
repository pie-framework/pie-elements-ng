# Creating PIE Elements with Theming

Guidelines for creating new PIE elements that support dynamic theming.

## Overview

All PIE elements should use the centralized color system from `@pie-lib/render-ui` to ensure proper theme support. This guide provides rules, examples, and best practices for element authors.

## Core Principles

### 1. Always Use Color Functions

```typescript
import { color } from '@pie-lib/render-ui';

// ✅ CORRECT: Use color functions
const Container = styled('div')({
  color: color.text(),
  backgroundColor: color.background(),
  border: `1px solid ${color.border()}`,
});

// ❌ WRONG: Hardcoded colors
const Container = styled('div')({
  color: '#000000',
  backgroundColor: 'white',
  border: '1px solid #ccc',
});
```

### 2. Use Semantic Names

```typescript
// ✅ CORRECT: Semantic meaning clear
const Feedback = styled('div')(({ isCorrect }) => ({
  backgroundColor: isCorrect ? color.correctSecondary() : color.incorrectSecondary(),
  color: isCorrect ? color.correct() : color.incorrect(),
}));

// ❌ WRONG: Unclear purpose
const Feedback = styled('div')({
  backgroundColor: color.primary(), // Is this for branding or feedback?
});
```

### 3. Use Theme Spacing

```typescript
// ✅ CORRECT: Use theme spacing system
const Container = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),        // 16px
  marginBottom: theme.spacing(1.5), // 12px
  gap: theme.spacing(1),            // 8px
}));

// ❌ WRONG: Hardcoded pixel values
const Container = styled('div')({
  padding: '16px',
  marginBottom: '12px',
  gap: '8px',
});
```

### 4. Provide Visual Hierarchy

Use appropriate color variants for different levels of emphasis:

```typescript
// ✅ CORRECT: Clear visual hierarchy
const Header = styled('div')({
  color: color.text(),              // Primary text
  borderBottom: `2px solid ${color.primary()}`, // Prominent border
});

const Subheader = styled('div')({
  color: color.disabled(),          // Secondary text
  borderBottom: `1px solid ${color.borderLight()}`, // Subtle border
});

const Icon = styled(CheckIcon)({
  color: color.correctIcon(),       // Darker for better visibility
});

const Background = styled('div')({
  backgroundColor: color.correctSecondary(), // Very subtle background
});
```

## Styling Rules

### ✅ DO: Use Color Functions

All colors must come from `color.*()` functions:

```typescript
import { color } from '@pie-lib/render-ui';

const Button = styled('button')({
  color: color.text(),
  backgroundColor: color.primary(),
  border: `1px solid ${color.border()}`,

  '&:hover': {
    backgroundColor: color.primaryLight(),
  },

  '&:disabled': {
    color: color.disabled(),
    backgroundColor: color.disabledSecondary(),
  },
});
```

### ❌ DON'T: Hardcode Colors

Never use hex, rgb, or named colors directly:

```typescript
// ❌ BAD - hardcoded colors
const Button = styled('button')({
  color: '#000000',
  backgroundColor: '#3F51B5',
  border: '1px solid #ccc',

  '&:hover': {
    backgroundColor: '#9FA8DA',
  },
});
```

### ✅ DO: Use Theme Functions

Access theme via styled components:

```typescript
const Container = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  fontFamily: theme.typography.fontFamily,
}));
```

### ❌ DON'T: Hardcode Values

```typescript
// ❌ BAD - hardcoded spacing
const Container = styled('div')({
  padding: '16px',
  borderRadius: '4px',
  fontFamily: 'Roboto, sans-serif',
});
```

### ✅ DO: Use Appropriate Variants

Choose the right color variant for the context:

```typescript
// For backgrounds - use secondary/faded variants
const CorrectBackground = styled('div')({
  backgroundColor: color.correctSecondary(), // Subtle green
});

// For borders - use darker variants
const CorrectBorder = styled('div')({
  border: `2px solid ${color.correctTertiary()}`, // Darker green
});

// For icons - use icon variants
const CorrectIcon = styled(CheckIcon)({
  color: color.correctIcon(), // Darkest green for visibility
});
```

### ❌ DON'T: Use Same Color Everywhere

```typescript
// ❌ BAD - same color for everything
const Container = styled('div')({
  backgroundColor: color.correct(), // Too intense for background
  border: `1px solid ${color.correct()}`, // Border not visible
});

const Icon = styled(CheckIcon)({
  color: color.correct(), // May not be dark enough
});
```

### ✅ DO: Handle Disabled States

```typescript
const Input = styled('input')(({ disabled }) => ({
  color: disabled ? color.disabled() : color.text(),
  backgroundColor: disabled ? color.disabledSecondary() : color.background(),
  borderColor: disabled ? color.disabled() : color.border(),
  cursor: disabled ? 'not-allowed' : 'text',
}));
```

### ✅ DO: Handle Focus States

```typescript
const Checkbox = styled('input')(({ checked }) => ({
  '&:focus': {
    outline: 'none',
    boxShadow: checked
      ? `0 0 0 3px ${color.focusChecked()}`
      : `0 0 0 3px ${color.focusUnchecked()}`,
    borderColor: checked
      ? color.focusCheckedBorder()
      : color.focusUncheckedBorder(),
  },
}));
```

## Common Patterns

### Form Elements

```typescript
const TextField = styled('input')({
  color: color.text(),
  backgroundColor: color.background(),
  border: `1px solid ${color.border()}`,

  '&:focus': {
    outline: 'none',
    borderColor: color.primary(),
    boxShadow: `0 0 0 3px ${color.focusUnchecked()}`,
  },

  '&:disabled': {
    color: color.disabled(),
    backgroundColor: color.disabledSecondary(),
    borderColor: color.disabled(),
  },

  '&::placeholder': {
    color: color.disabled(),
  },
});
```

### Feedback Messages

```typescript
const FeedbackMessage = styled('div')<{ type: 'correct' | 'incorrect' | 'missing' }>(
  ({ type }) => ({
    padding: '12px 16px',
    borderRadius: '4px',
    borderLeft: '4px solid',

    ...(type === 'correct' && {
      backgroundColor: color.correctSecondary(),
      borderColor: color.correct(),
      color: color.correctTertiary(),
    }),

    ...(type === 'incorrect' && {
      backgroundColor: color.incorrectSecondary(),
      borderColor: color.incorrect(),
      color: color.text(),
    }),

    ...(type === 'missing' && {
      backgroundColor: color.background(),
      borderColor: color.missing(),
      color: color.text(),
    }),
  })
);
```

### Choice Options (Multiple Choice, etc.)

```typescript
const ChoiceButton = styled('button')<{ selected?: boolean; correct?: boolean }>(
  ({ theme, selected, correct }) => ({
    padding: theme.spacing(2),
    textAlign: 'left',
    cursor: 'pointer',
    border: `2px solid ${color.border()}`,
    backgroundColor: color.background(),
    color: color.text(),
    transition: 'all 0.2s',

    ...(selected && {
      borderColor: color.primary(),
      backgroundColor: color.fadedPrimary(),
    }),

    ...(correct !== undefined && {
      borderColor: correct ? color.correct() : color.incorrect(),
      backgroundColor: correct ? color.correctSecondary() : color.incorrectSecondary(),
    }),

    '&:hover': {
      borderColor: color.primaryLight(),
      backgroundColor: color.fadedPrimary(),
    },

    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  })
);
```

### Icons with Semantic Meaning

```typescript
const CorrectIcon = styled(CheckCircleIcon)({
  color: color.correctIcon(),
  fontSize: 24,
});

const IncorrectIcon = styled(CancelIcon)({
  color: color.incorrectIcon(),
  fontSize: 24,
});

const MissingIcon = styled(WarningIcon)({
  color: color.missingIcon(),
  fontSize: 24,
});
```

### Drag and Drop

```typescript
const DraggableItem = styled('div')<{ isDragging?: boolean }>(({ isDragging }) => ({
  padding: '8px 12px',
  border: `1px solid ${color.border()}`,
  backgroundColor: color.background(),
  cursor: 'grab',

  ...(isDragging && {
    opacity: 0.5,
    cursor: 'grabbing',
    borderColor: color.primary(),
  }),
}));

const DropZone = styled('div')<{ isOver?: boolean; canDrop?: boolean }>(
  ({ isOver, canDrop }) => ({
    minHeight: '60px',
    border: `2px dashed ${color.borderLight()}`,
    backgroundColor: color.background(),

    ...(canDrop && {
      borderColor: color.primary(),
      backgroundColor: color.fadedPrimary(),
    }),

    ...(isOver && {
      borderColor: color.primaryDark(),
      backgroundColor: color.primaryLight(),
    }),
  })
);
```

## Component Examples

### Complete Multiple Choice Button

```typescript
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface ChoiceProps {
  selected?: boolean;
  correct?: boolean;
  disabled?: boolean;
}

const ChoiceContainer = styled('div')<ChoiceProps>(
  ({ theme, selected, correct, disabled }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.shape.borderRadius,
    border: `2px solid ${color.border()}`,
    backgroundColor: color.background(),
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',

    // Selected state
    ...(selected && {
      borderColor: color.primary(),
      backgroundColor: color.fadedPrimary(),
    }),

    // Feedback state
    ...(correct === true && {
      borderColor: color.correct(),
      backgroundColor: color.correctSecondary(),
    }),

    ...(correct === false && {
      borderColor: color.incorrect(),
      backgroundColor: color.incorrectSecondary(),
    }),

    // Hover (only if not showing feedback)
    ...(!disabled && correct === undefined && {
      '&:hover': {
        borderColor: color.primaryLight(),
        backgroundColor: color.fadedPrimary(),
      },
    }),

    // Disabled
    ...(disabled && {
      opacity: 0.6,
    }),
  })
);

const ChoiceIcon = styled('div')<{ correct?: boolean }>(({ correct }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: '50%',
  flexShrink: 0,

  ...(correct === true && {
    backgroundColor: color.correct(),
    color: color.white(),
  }),

  ...(correct === false && {
    backgroundColor: color.incorrect(),
    color: color.white(),
  }),
}));

const ChoiceLabel = styled('div')<{ correct?: boolean }>(({ correct }) => ({
  flex: 1,
  color: color.text(),

  ...(correct !== undefined && {
    fontWeight: 500,
  }),
}));

export function Choice({ label, selected, correct, disabled, onClick }: ChoiceComponentProps) {
  return (
    <ChoiceContainer
      selected={selected}
      correct={correct}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {correct !== undefined && (
        <ChoiceIcon correct={correct}>
          {correct ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
        </ChoiceIcon>
      )}
      <ChoiceLabel correct={correct}>{label}</ChoiceLabel>
    </ChoiceContainer>
  );
}
```

## Testing

### Test with Multiple Themes

Always test your element with both light and dark themes:

```typescript
import { render } from '@testing-library/react';
import { PieThemeProvider } from '@pie-element/theming';

const lightTheme = {
  'base-content': '#000000',
  'base-100': '#FFFFFF',
  primary: '#3F51B5',
  success: '#4CAF50',
  error: '#FF9800',
};

const darkTheme = {
  'base-content': '#FFFFFF',
  'base-100': '#1A1A1A',
  primary: '#9FA8DA',
  success: '#81C784',
  error: '#FFB74D',
};

describe('MyElement theming', () => {
  it('adapts to light theme', () => {
    const { container } = render(
      <PieThemeProvider config={{ theme: lightTheme }}>
        <MyElement />
      </PieThemeProvider>
    );

    const element = container.querySelector('.my-element');
    const styles = getComputedStyle(element);
    expect(styles.color).toBe('rgb(0, 0, 0)'); // Black
  });

  it('adapts to dark theme', () => {
    const { container } = render(
      <PieThemeProvider config={{ theme: darkTheme }}>
        <MyElement />
      </PieThemeProvider>
    );

    const element = container.querySelector('.my-element');
    const styles = getComputedStyle(element);
    expect(styles.color).toBe('rgb(255, 255, 255)'); // White
  });
});
```

### Visual Regression Testing

Use screenshots to verify theming:

```typescript
import { render } from '@testing-library/react';

it('matches light theme snapshot', () => {
  const { container } = render(
    <PieThemeProvider config={{ theme: lightTheme }}>
      <MyElement />
    </PieThemeProvider>
  );

  expect(container).toMatchSnapshot();
});

it('matches dark theme snapshot', () => {
  const { container } = render(
    <PieThemeProvider config={{ theme: darkTheme }}>
      <MyElement />
    </PieThemeProvider>
  );

  expect(container).toMatchSnapshot();
});
```

## Checklist for New Elements

Before submitting a new element, verify:

- [ ] All colors use `color.*()` functions
- [ ] No hardcoded hex/rgb colors in code
- [ ] Spacing uses `theme.spacing()` function
- [ ] Semantic color names used appropriately
- [ ] Disabled states handled correctly
- [ ] Focus states have proper styling
- [ ] Tested with light theme
- [ ] Tested with dark theme
- [ ] Visual contrast meets accessibility requirements
- [ ] CSS variables have proper fallbacks
- [ ] Documentation includes theming examples
- [ ] No console warnings about invalid colors

## Common Mistakes

### Using Colors from MUI Palette

```typescript
// ❌ WRONG: Accessing MUI palette directly
const Button = styled('button')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main, // Don't do this
}));

// ✅ CORRECT: Use color functions
const Button = styled('button')({
  backgroundColor: color.primary(),
});
```

### Mixing Hardcoded and Dynamic Colors

```typescript
// ❌ WRONG: Mixing approaches
const Container = styled('div')({
  color: color.text(),        // Dynamic
  backgroundColor: '#FFFFFF', // Hardcoded - won't change with theme
});

// ✅ CORRECT: All dynamic
const Container = styled('div')({
  color: color.text(),
  backgroundColor: color.background(),
});
```

### Not Using Semantic Variants

```typescript
// ❌ WRONG: Using primary color for feedback
const CorrectAnswer = styled('div')({
  backgroundColor: color.primary(), // This is for branding, not feedback
});

// ✅ CORRECT: Using semantic color
const CorrectAnswer = styled('div')({
  backgroundColor: color.correctSecondary(),
});
```

## Getting Help

If you're unsure about which color to use:

1. Check existing elements for similar use cases
2. Review the [Color System](./02-color-system.md) documentation
3. Test with multiple themes to see if it looks reasonable
4. Ask for code review from other element authors

## Next Steps

- [**Color System**](./02-color-system.md) - Complete color reference
- [**Custom Themes**](./07-custom-themes.md) - Create test themes
- [**API Reference**](./08-api-reference.md) - Complete API documentation
