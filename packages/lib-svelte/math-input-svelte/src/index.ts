import type { Component } from 'svelte';
import MathFieldComponent from './MathField.svelte';
import StaticMathComponent from './StaticMath.svelte';
import type { MathFieldProps, StaticMathProps } from './types.js';

export type { MathFieldProps, StaticMathProps } from './types.js';

// Typed through `.ts` props types so the emitted declarations reference no `.svelte` file:
// `dist` ships the compiled components only.
export const MathField: Component<MathFieldProps> = MathFieldComponent;
export const StaticMath: Component<StaticMathProps> = StaticMathComponent;
