import PrintComponent from './Print.svelte';

const SvelteElementClass = (PrintComponent as any).element;

class SimpleClozePrint extends SvelteElementClass {
  private _model: any = null;

  set model(m: any) {
    this._model = m;
    super.model = m;
  }

  get model() {
    return this._model;
  }
}

export default SimpleClozePrint;
