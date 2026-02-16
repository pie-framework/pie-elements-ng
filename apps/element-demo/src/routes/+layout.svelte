<script lang="ts">
import '../app.css';
import { onMount } from 'svelte';
import { theme } from '$lib/stores/demo-state';
import {
  PIE_LIGHT_THEME,
  PIE_DARK_THEME,
  generateCssVariables,
  injectCssVariables,
} from '@pie-element/shared-theming';

const { children } = $props();

// Apply PIE theme based on current theme selection
function applyPieTheme(currentTheme: 'light' | 'dark') {
  const pieTheme = currentTheme === 'dark' ? PIE_DARK_THEME : PIE_LIGHT_THEME;
  const cssVariables = generateCssVariables(pieTheme);
  injectCssVariables(cssVariables);
  console.log('[theme] Applied PIE theme:', currentTheme, cssVariables);
}

onMount(() => {
  // Initialize theme from localStorage or system preference
  const storedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = (storedTheme as 'light' | 'dark') || (systemPrefersDark ? 'dark' : 'light');

  theme.set(initialTheme);

  // Apply DaisyUI theme to HTML element
  document.documentElement.setAttribute('data-theme', initialTheme);

  // Apply PIE theme
  applyPieTheme(initialTheme);

  // Subscribe to theme store changes
  const unsubscribe = theme.subscribe((currentTheme) => {
    // Update DaisyUI theme
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Update localStorage
    localStorage.setItem('theme', currentTheme);

    // Apply PIE theme
    applyPieTheme(currentTheme);
  });

  return () => {
    unsubscribe();
  };
});
</script>

{@render children()}
