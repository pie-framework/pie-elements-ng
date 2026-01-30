<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';

// Get default element name
const defaultElement = import.meta.env.VITE_ELEMENT_NAME || 'multiple-choice';

// Redirect to the default element landing page
onMount(() => {
  goto(`/${defaultElement}`);
});
</script>

<div class="hero min-h-screen bg-gradient-to-br from-primary to-secondary">
  <div class="hero-content text-center">
    <div class="max-w-2xl card bg-base-100 shadow-2xl p-8">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="mt-4 text-base-content/70">Redirecting to element demo...</p>
    </div>
  </div>
</div>
