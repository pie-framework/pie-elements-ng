import { isLocaleReady, loadLocale } from '@pie-element/shared-i18n';

/**
 * The language the chrome renders in: `wanted()` once every catalog on the page
 * holds it, and until then the language last resident, so no frame renders in a
 * language whose strings are still loading. `wanted()` returns `null` when there
 * is nothing to render; `current` is `null` until the first language is resident,
 * and the component renders nothing while it is.
 */
export function residentLanguage(wanted: () => string | undefined | null): {
  readonly current: string | undefined | null;
} {
  let loads = $state(0);
  let resident: string | undefined | null = null;
  const current = $derived.by(() => {
    void loads;
    const language = wanted();
    if (language === null) {
      resident = null;
    } else if (isLocaleReady(language)) {
      resident = language;
    } else {
      void loadLocale(language).then(() => loads++);
    }
    return resident;
  });
  return {
    get current() {
      return current;
    },
  };
}
