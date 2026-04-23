<script lang="ts">
import '../app.css';
import { onMount } from 'svelte';
import { theme } from '$lib/stores/demo-state';
import '@pie-element/element-theme-daisyui';

const { children } = $props();

onMount(() => {
  // Initialize theme from localStorage or system preference
  const storedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = (storedTheme as 'light' | 'dark') || (systemPrefersDark ? 'dark' : 'light');

  theme.set(initialTheme);
});

$effect(() => {
  localStorage.setItem('theme', $theme);
});
</script>

{@render children()}
