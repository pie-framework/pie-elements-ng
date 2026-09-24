---
"@pie-lib/delivery-events-svelte": patch
---

`resolveDeliveryHost` continues from a shadow root to its host, so a wrapper that renders the element inside its own shadow root is found. `forwardSessionChange` warns once per source element when there is no host to forward to (PIE-1075).
