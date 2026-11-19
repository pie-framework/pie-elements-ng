import { type LiteralOpts, latexEqual, type Mode, type Opts } from '../src/index.js';

const LITERAL_FLAGS = ['allowTrailingZeros', 'ignoreOrder', 'compareNumbersByValue'] as const;

const form = document.querySelector<HTMLFormElement>('#equality-form')!;
const literalOptions = document.querySelector<HTMLFieldSetElement>('#literal-options')!;
const result = document.querySelector<HTMLOutputElement>('#result')!;
const mode = form.elements.namedItem('mode') as HTMLSelectElement;

const input = (name: string) => form.elements.namedItem(name) as HTMLInputElement;

const toOpts = (data: FormData): Opts => {
  const m = data.get('mode') === 'literal' ? 'literal' : 'symbolic';
  if (m === 'symbolic') {
    return { mode: m };
  }
  const literal: LiteralOpts = {};
  for (const flag of LITERAL_FLAGS) {
    literal[flag] = data.has(flag);
  }
  return { mode: m, literal };
};

const show = (verdict: 'equal' | 'unequal' | 'error', message: string) => {
  result.dataset.verdict = verdict;
  result.textContent = message;
};

const compare = () => {
  const data = new FormData(form);
  const a = String(data.get('a') ?? '');
  const b = String(data.get('b') ?? '');
  const opts = toOpts(data);

  try {
    const equal = latexEqual(a, b, opts);
    show(equal ? 'equal' : 'unequal', `${equal ? 'Equal' : 'Not equal'} in ${opts.mode} mode.`);
  } catch (e) {
    show('error', `Could not compare: ${e instanceof Error ? e.message : String(e)}`);
  }

  const params = new URLSearchParams();
  for (const [key, value] of data) {
    params.set(key, String(value));
  }
  window.history.replaceState(null, '', `?${params}`);
};

const syncLiteralOptions = () => {
  literalOptions.hidden = mode.value !== 'literal';
};

// Restore the check a shared URL describes.
const params = new URLSearchParams(window.location.search);
mode.value = (params.get('mode') as Mode | null) ?? 'symbolic';
input('a').value = params.get('a') ?? '';
input('b').value = params.get('b') ?? '';
for (const flag of LITERAL_FLAGS) {
  input(flag).checked = params.has(flag);
}
syncLiteralOptions();

mode.addEventListener('change', syncLiteralOptions);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  compare();
});

if (form.checkValidity()) {
  compare();
}
