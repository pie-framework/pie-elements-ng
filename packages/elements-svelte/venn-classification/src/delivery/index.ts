import VennClassificationComponent from './VennClassification.svelte';
import { isComplete as isControllerComplete } from '../controller/index.js';
import {
  ModelSetEvent,
  SessionChangedEvent,
  writeSessionInPlace,
} from '@pie-lib/delivery-events-svelte';

const SvelteElementClass = (VennClassificationComponent as any).element;

class VennClassificationElement extends SvelteElementClass {
  _internalSession: any = null;
  /**
   * The session object the player handed us. A player reads the learner's
   * response back off this object, so every update is written into it as well
   * as into the copy the component renders from.
   */
  _playerSession: any = null;
  _model: any = null;

  _isComplete = () => {
    return isControllerComplete(this._model, this._internalSession);
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

  /**
   * A re-set of the same object is an update, not a no-op: a player sets the
   * session before the model on load and again after it (`element.model = …;
   * element.session = sameObject`), and only that second event can report a
   * restored session as complete. A player that clears the response in place
   * re-sets its object the same way, and the component must re-render it.
   */
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

export default VennClassificationElement;
