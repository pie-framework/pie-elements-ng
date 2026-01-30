<script>
import { onMount } from 'svelte';
import { getElementModule, hasElementModule } from '$lib/element-imports';

let status = $state('Loading...');
let elementClass = $state(null);
let controller = $state(null);
let errors = $state([]);

onMount(async () => {
  try {
    // Test element import
    if (hasElementModule('@pie-element/multiple-choice')) {
      const mod = await getElementModule('@pie-element/multiple-choice');
      elementClass = mod.default?.name || 'Unknown';
      status = 'Element loaded: ' + elementClass;
    } else {
      errors.push('Element not registered');
    }

    // Test controller import
    if (hasElementModule('@pie-element/multiple-choice/controller')) {
      const mod = await getElementModule('@pie-element/multiple-choice/controller');
      controller = mod.model ? 'Controller has model method' : 'Controller loaded but no model';
    } else {
      errors.push('Controller not registered');
    }

    if (errors.length === 0) {
      status = 'All imports successful!';
    }
  } catch (err) {
    errors.push(err.message);
    status = 'Error loading modules';
  }
});
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">Import Test</h1>
  <div class="mb-4">
    <p class="text-lg">{status}</p>
  </div>
  {#if elementClass}
    <div class="mb-2">
      <strong>Element Class:</strong> {elementClass}
    </div>
  {/if}
  {#if controller}
    <div class="mb-2">
      <strong>Controller:</strong> {controller}
    </div>
  {/if}
  {#if errors.length > 0}
    <div class="mt-4 p-4 bg-red-100 border border-red-400 rounded">
      <h2 class="font-bold text-red-800">Errors:</h2>
      <ul class="list-disc list-inside">
        {#each errors as error}
          <li class="text-red-700">{error}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
