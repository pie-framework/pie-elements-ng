import PrintComponent from './Print.svelte';

const SvelteElementClass = (PrintComponent as any).element;

class McPopulatedBlankPrint extends SvelteElementClass {
  private _model: any = null;
  private _options: any = null;

  set model(m: any) {
    this._model = m;
    super.model = m;
  }

  get model() {
    return this._model;
  }

  /** `pie-print` sets these before the model; `role` decides whether the key prints. */
  set options(o: any) {
    this._options = o;
    super.options = o;
  }

  get options() {
    return this._options;
  }
}

export default McPopulatedBlankPrint;
