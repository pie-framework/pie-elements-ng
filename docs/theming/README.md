# PIE Elements Theming Guide

Complete guide to theming PIE elements using the `@pie-element/theming` packages.

## Overview

PIE elements support dynamic theming through CSS custom properties and adapter packages. The theming system is designed to:

- Work with any UI framework (DaisyUI, Material-UI, Bootstrap, etc.)
- Support runtime theme switching
- Maintain backwards compatibility with existing elements
- Provide 45+ color variables covering all PIE use cases

## Quick Links

1. [**Overview**](./01-overview.md) - Architecture and key concepts
2. [**Color System**](./02-color-system.md) - Complete reference of 45+ colors
3. [**Using Themes**](./03-using-themes.md) - Integration guide for applications
4. [**DaisyUI Integration**](./04-daisyui-integration.md) - DaisyUI adapter usage
5. [**MUI Integration**](./05-mui-integration.md) - Material-UI adapter usage
6. [**Creating Elements**](./06-creating-elements.md) - Guidelines for element authors
7. [**Custom Themes**](./07-custom-themes.md) - Creating custom themes
8. [**API Reference**](./08-api-reference.md) - Complete API documentation

## Quick Start

### Installation

```bash
npm install @pie-element/theming @pie-element/theming-daisyui
```

### Basic Usage

```typescript
import { extractDaisyUiTheme, daisyUiToPieTheme } from '@pie-element/theming-daisyui';
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';

// Extract current DaisyUI theme
const daisyTheme = extractDaisyUiTheme();
const pieTheme = daisyUiToPieTheme(daisyTheme);

// Generate CSS variables
const cssVars = generateCssVariables(pieTheme);
const styleString = cssVariablesToStyleString(cssVars);

// Apply to container
document.querySelector('.pie-container').style.cssText = styleString;
```

## Packages

- **[@pie-element/theming](./08-api-reference.md#pie-elementtheming)** - Base theming utilities
- **[@pie-element/theming-daisyui](./08-api-reference.md#pie-elementtheming-daisyui)** - DaisyUI adapter
- **[@pie-element/theming-mui](./08-api-reference.md#pie-elementtheming-mui)** - Material-UI adapter

## Support

For issues or questions:
- Check the [API Reference](./08-api-reference.md)
- See [Creating Elements](./06-creating-elements.md) for styling guidelines
- Review examples in the demo code
