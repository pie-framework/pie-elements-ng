<script lang="ts">
// Get element name from environment variable or default to 'element'
const elementName = import.meta.env.VITE_ELEMENT_NAME || 'element';
const packageName = `@pie-element/${elementName}`;

// Format element name for display (e.g., "multiple-choice" -> "Multiple Choice")
function formatElementName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
</script>

<div class="navbar bg-base-100 shadow-lg" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0;">
  <div class="flex items-center gap-3 ml-4">
    <img src="/pie-logo-orange.svg" alt="PIE Logo" class="w-10 h-10" />
    <div class="flex flex-col">
      <span class="text-xl font-bold">{formatElementName(elementName)}</span>
      <span class="text-xs text-base-content/70">{packageName}</span>
    </div>
  </div>
  <div class="mr-4">
    <label class="flex cursor-pointer gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <circle cx="12" cy="12" r="5" />
        <path
          d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </svg>
      <input type="checkbox" value="dark" class="toggle theme-controller" />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </label>
  </div>
</div>
