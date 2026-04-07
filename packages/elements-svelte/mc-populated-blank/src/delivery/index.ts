import McPopulatedBlankComponent from './McPopulatedBlank.svelte';
import { isComplete as isControllerComplete } from '../controller';

const SvelteElementClass = (McPopulatedBlankComponent as any).element;

class McPopulatedBlankElement extends SvelteElementClass {
  _internalSession: any = null;
  _model: any = null;
  _options: any = null;
  audioComplete = false;

  _dispatchModelSet = () => {
    this.dispatchEvent(
      new CustomEvent('model-set', {
        bubbles: true,
        composed: true,
        detail: {
          complete: this._isComplete(),
          component: this.tagName.toLowerCase(),
          hasModel: this._model !== undefined,
        },
      })
    );
  };

  _dispatchSessionChanged = () => {
    this.dispatchEvent(
      new CustomEvent('session-changed', {
        bubbles: true,
        composed: true,
        detail: {
          complete: this._isComplete(),
          component: this.tagName.toLowerCase(),
        },
      })
    );
  };

  set model(m: any) {
    this._model = m;
    this.audioComplete = false;
    super.model = m;
    this._dispatchModelSet();
  }

  get model() {
    return this._model;
  }

  set session(s: any) {
    this._internalSession = s;
    super.session = s;
    this._dispatchSessionChanged();
  }

  get session() {
    return this._internalSession;
  }

  set options(o: any) {
    this._options = o;
    super.options = o;
  }

  get options() {
    return this._options;
  }

  onSessionChange = (updatedSession: any) => {
    this._internalSession = updatedSession;
    this._dispatchSessionChanged();
  };

  onAudioStarted = () => {
    this._internalSession = {
      ...(this._internalSession || {}),
      audioStartTime: new Date().getTime(),
    };
  };

  onAudioEnded = () => {
    this.audioComplete = true;
    this._internalSession = {
      ...(this._internalSession || {}),
      audioEndTime: new Date().getTime(),
    };
    this._dispatchSessionChanged();
  };

  _isComplete = () => {
    return isControllerComplete(this._model, this._internalSession, this.audioComplete);
  };

  connectedCallback() {
    super.connectedCallback();
    (this as any).onSessionChange = this.onSessionChange;
    (this as any).onAudioStarted = this.onAudioStarted;
    (this as any).onAudioEnded = this.onAudioEnded;
  }
}

export default McPopulatedBlankElement;
