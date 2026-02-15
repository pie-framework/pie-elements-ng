// Import the Svelte component compiled as custom element
import SimpleClozeComponent from './SimpleCloze.svelte';

// Get the base Svelte custom element class
const SvelteElementClass = (SimpleClozeComponent as any).element;

// Create a wrapper that properly handles session updates
class SimpleClozeElement extends SvelteElementClass {
  _internalSession: any = null;

  // Override the session setter to maintain internal state
  set session(s: any) {
    this._internalSession = s;
    // Update the Svelte component's props
    super.session = s;
  }

  // Override the session getter to return internal state
  get session() {
    return this._internalSession;
  }

  // Provide a callback for the Svelte component to update session
  onSessionChange = (updatedSession: any) => {
    this._internalSession = updatedSession;
  };

  connectedCallback() {
    super.connectedCallback();
    // Set the callback on the Svelte component instance
    (this as any).onSessionChange = this.onSessionChange;
  }
}

// Export the custom element class
// The demo loader will register it with customElements.define()
export default SimpleClozeElement;
