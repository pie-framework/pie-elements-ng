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
  /**
   * The session object the player handed us, which `session` returns. A player
   * reads the learner's response back off this object, so every update is
   * written into it; the component renders from a fresh copy so its `$derived`
   * reads re-run.
   */
  _playerSession: any = null;
  _model: any = null;

  _isComplete = () => {
    const value = this._playerSession?.value;
    return typeof value === 'string' && value.trim().length > 0;
  };

  /**
   * Dispatched a microtask later: on load a player sets the model and then the
   * session in the same task (`element.model = …; element.session = …`), and
   * `complete` can only report a restored response once the session is here.
   */
  _dispatchModelSet = () => {
    queueMicrotask(() => {
      this.dispatchEvent(
        new ModelSetEvent(this.tagName.toLowerCase(), this._isComplete(), this._model !== undefined)
      );
    });
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
    super.session = s;
    this._dispatchSessionChanged();
  }

  get session() {
    return this._playerSession;
  }

  onSessionChange = (updatedSession: any) => {
    // A frozen or missing player session cannot be written into; the update
    // then replaces it, as `writeSessionInPlace` returns.
    this._playerSession = writeSessionInPlace(this._playerSession, updatedSession);
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
