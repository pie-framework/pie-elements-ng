import VennClassificationComponent from './VennClassification.svelte';
import { isComplete as isControllerComplete } from '../controller/index.js';
import { ModelSetEvent, SessionChangedEvent } from '@pie-lib/delivery-events-svelte';

const SvelteElementClass = (VennClassificationComponent as any).element;

class VennClassificationElement extends SvelteElementClass {
  _internalSession: any = null;
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

  set session(s: any) {
    // Avoid redundant reactive loops: if the incoming session is structurally
    // identical to the last one we saw, skip the update.
    if (s === this._internalSession) return;
    this._internalSession = s;
    super.session = s;
    this._dispatchSessionChanged();
  }

  get session() {
    return this._internalSession;
  }

  onSessionChange = (updatedSession: any) => {
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
