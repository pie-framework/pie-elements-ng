<script lang="ts">
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { onMount } from 'svelte';
import { initializeDemo, mode, role } from '$lib/stores/demo-state';
import type { LayoutData } from './$types';

let { data, children }: { data: LayoutData; children: any } = $props();

onMount(() => {
  initializeDemo({
    elementName: data.elementName,
    elementTitle: data.elementTitle,
    model: data.initialModel,
    session: data.initialSession,
    controller: null,
    capabilities: data.capabilities,
    demos: data.demos,
    activeDemoId: data.activeDemoId,
  });
});

function setRole(nextRole: 'student' | 'instructor') {
  role.set(nextRole);
  mode.set(nextRole === 'instructor' ? 'evaluate' : 'gather');

  const url = new URL($page.url);
  url.searchParams.set('role', nextRole);
  url.searchParams.set('mode', nextRole === 'instructor' ? 'evaluate' : 'gather');
  goto(url.toString(), { replaceState: true, noScroll: true });
}
</script>

<div class="navbar min-h-12 bg-base-100 border-b border-base-300 px-4">
  <div class="flex-1">
    <a class="font-semibold" href="/{data.elementName}">{data.elementTitle} parity</a>
  </div>
  <div class="join">
    <button
      type="button"
      class="btn btn-sm join-item"
      class:btn-primary={$role === 'student'}
      data-testid="role-student"
      onclick={() => setRole('student')}
    >
      Student
    </button>
    <button
      type="button"
      class="btn btn-sm join-item"
      class:btn-primary={$role === 'instructor'}
      data-testid="role-instructor"
      onclick={() => setRole('instructor')}
    >
      Instructor
    </button>
  </div>
</div>

{@render children()}
