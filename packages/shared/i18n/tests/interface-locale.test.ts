import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext, subscribeInterfaceLocale } from '../src/interface-locale.js';

/**
 * A stand-in provider: answers `context-request` bubbling past `ancestor` for
 * this context, keeps the subscription, and lets a test republish. Built on
 * the protocol's field shape, exactly as a bundled provider copy would be
 * answered — the events match by fields, not by class.
 */
function mountProvider(ancestor: HTMLElement) {
  // A player provider carries an initial value, answered at subscribe time.
  let current: { locale: string; direction: 'ltr' | 'rtl' } | undefined = {
    locale: 'en-US',
    direction: 'ltr',
  };
  const subscribers = new Set<() => void>();

  const listener = (event: Event) => {
    const request = event as Event & {
      context?: unknown;
      contextTarget?: Element;
      callback?: (value: unknown, unsubscribe?: () => void) => void;
      subscribe?: boolean;
    };
    if (request.context !== interfaceLocaleContext) return;
    if (request.subscribe !== true || typeof request.callback !== 'function') return;
    const unsubscribe = () => subscribers.delete(publish);
    const publish = () => request.callback?.(current, unsubscribe);
    subscribers.add(publish);
    publish();
  };

  ancestor.addEventListener('context-request', listener);
  return {
    publish: (value: { locale: string; direction: 'ltr' | 'rtl' } | undefined) => {
      current = value;
      for (const publish of subscribers) publish();
    },
    disconnect: () => {
      ancestor.removeEventListener('context-request', listener);
      for (const publish of subscribers) publish();
      subscribers.clear();
    },
  };
}

describe('subscribeInterfaceLocale', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('answers with the published locale and direction', () => {
    const ancestor = document.createElement('div');
    const child = document.createElement('pie-multiple-choice');
    ancestor.append(child);
    document.body.append(ancestor);
    const provider = mountProvider(ancestor);

    const onLocale = vi.fn();
    const disconnect = subscribeInterfaceLocale(child, onLocale);

    expect(onLocale).toHaveBeenCalledWith({ locale: 'en-US', direction: 'ltr' });

    provider.publish({ locale: 'es-MX', direction: 'ltr' });
    expect(onLocale).toHaveBeenLastCalledWith({ locale: 'es-MX', direction: 'ltr' });

    provider.publish({ locale: 'ar-SA', direction: 'rtl' });
    expect(onLocale).toHaveBeenLastCalledWith({ locale: 'ar-SA', direction: 'rtl' });
    expect(onLocale).toHaveBeenCalledTimes(3);

    disconnect();
    provider.publish({ locale: 'nl-NL', direction: 'ltr' });
    expect(onLocale).toHaveBeenCalledTimes(3);
  });

  it('answers a request made before the provider connects', () => {
    const ancestor = document.createElement('div');
    const child = document.createElement('pie-multiple-choice');
    ancestor.append(child);
    document.body.append(ancestor);

    const onLocale = vi.fn();
    const disconnect = subscribeInterfaceLocale(child, onLocale);
    // Unanswered so far: the document context root has recorded the request,
    // and no callback has run.
    expect(onLocale).not.toHaveBeenCalled();

    const provider = mountProvider(ancestor);
    // The provider announces itself on its element, as pie-context's
    // ContextProvider.connect does, and the recorded request is replayed.
    const announcement = Object.assign(
      new Event('context-provider', { bubbles: true, composed: true }),
      { context: interfaceLocaleContext, contextTarget: ancestor }
    );
    ancestor.dispatchEvent(announcement);

    expect(onLocale).toHaveBeenCalledWith({ locale: 'en-US', direction: 'ltr' });

    provider.disconnect();
    disconnect();
  });

  it('stays unanswered with no player, and releases the subscription on disconnect', () => {
    const parent = document.createElement('div');
    const child = document.createElement('pie-multiple-choice');
    parent.append(child);
    document.body.append(parent);

    const onLocale = vi.fn();
    const disconnect = subscribeInterfaceLocale(child, onLocale);
    expect(onLocale).not.toHaveBeenCalled();

    disconnect();
    // A provider arriving after the disconnect must not reach a released callback.
    const provider = mountProvider(parent);
    const announcement = Object.assign(
      new Event('context-provider', { bubbles: true, composed: true }),
      { context: interfaceLocaleContext, contextTarget: parent }
    );
    parent.dispatchEvent(announcement);
    expect(onLocale).not.toHaveBeenCalled();
  });
});
