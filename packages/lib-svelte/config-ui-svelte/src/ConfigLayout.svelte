<script lang="ts">
import type { ConfigLayoutProps } from './types.js';

let { children, settings, hideSettings = false }: ConfigLayoutProps = $props();
</script>

<!--
  Class names are prefixed: author elements render without a shadow root, so a
  host's `.contents` or `.toggle` would otherwise restyle these.

  The settings sit beside the design view once the layout is wider than
  React's `sidePanelMinWidth` (1135px), and below it otherwise. React switches
  to Design / Settings tabs when narrow; below keeps the reading order.
-->
<div class="pie-config-layout">
  <div class="pie-config-layout-contents">
    <div class="pie-config-layout-design">
      {@render children()}
    </div>
    {#if settings && !hideSettings}
      <aside class="pie-config-layout-settings" aria-label="Settings">
        {@render settings()}
      </aside>
    {/if}
  </div>
</div>

<style>
  .pie-config-layout {
    container-type: inline-size;
  }

  .pie-config-layout-contents {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pie-config-layout-design {
    flex: 1 1 auto;
    min-width: 0;
  }

  @container (min-width: 1135px) {
    .pie-config-layout-contents {
      flex-direction: row;
      align-items: flex-start;
    }

    .pie-config-layout-settings {
      flex: 0 0 300px;
      position: sticky;
      top: 0;
    }
  }
</style>
