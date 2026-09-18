// Import the Svelte component compiled as custom element
import SimpleClozeComponent from './SimpleCloze.svelte';
import {
  ModelSetEvent,
  SessionChangedEvent,
  writeSessionInPlace,
} from '@pie-lib/delivery-events-svelte';

// Get the base Svelte custom element class
const SvelteElementClass = (SimpleClozeComponent as any).element;

// Create a wrapper that properly handles session updates
class SimpleClozeElement extends SvelteElementClass {
  _internalSession: any = null;
  /**
   * The session object the player handed us. A player reads the learner's
   * response back off this object, so every update is written into it as well
   * as into the copy the component renders from.
   */
  _playerSession: any = null;
  _model: any = null;

  _isComplete = () => {
    const response = this._internalSession?.response;
    return typeof response === 'string' && response.trim().length > 0;
  };

  _dispatchModelSet = () => {
    this.dispatchEvent(
      new ModelSetEvent(this.tagName.toLowerCase(), this._isComplete(), this._model !== undefined)
    );
  };

  _dispatchSessionChanged = () => {
    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this._isComplete()));
  };

  set model(m: any) {
    this._model = m;
    super.model = m;
    this._dispatchModelSet();
  }

  get model() {
    return this._model;
  }

  set session(s: any) {
    this._playerSession = s;
    this._internalSession = s;
    super.session = s;
    this._dispatchSessionChanged();
  }

  get session() {
    return this._internalSession;
  }

  onSessionChange = (updatedSession: any) => {
    writeSessionInPlace(this._playerSession, updatedSession);
    this._internalSession = updatedSession;
    super.session = updatedSession;
    this._dispatchSessionChanged();
  };

  connectedCallback() {
    super.connectedCallback();
    (this as any).onSessionChange = this.onSessionChange;
  }
}

// Export the custom element class
// The demo loader will register it with customElements.define()
export default SimpleClozeElement;
