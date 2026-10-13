import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { createUniqueId, useUniqueId } from '../src/unique-id';

describe('createUniqueId', () => {
  it('starts with the prefix and is a valid CSS identifier', () => {
    expect(createUniqueId('dropdown-0')).toMatch(/^dropdown-0-[0-9a-z]+$/);
  });

  it('differs between copies of the module, as when two element versions share a page', async () => {
    vi.resetModules();
    const firstCopy = await import('../src/unique-id');
    vi.resetModules();
    const secondCopy = await import('../src/unique-id');

    expect(secondCopy.createUniqueId).not.toBe(firstCopy.createUniqueId);
    expect(secondCopy.createUniqueId('x')).not.toBe(firstCopy.createUniqueId('x'));
  });
});

describe('useUniqueId', () => {
  const Probe = ({ label }: { label: string }) => <span id={useUniqueId('probe')}>{label}</span>;

  it('gives each instance its own id and keeps it across re-renders', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() =>
      root.render(
        <>
          <Probe label="a" />
          <Probe label="b" />
        </>,
      ),
    );
    const [first, second] = [...host.querySelectorAll('span')].map((el) => el.id);
    expect(first).not.toBe(second);

    act(() =>
      root.render(
        <>
          <Probe label="c" />
          <Probe label="d" />
        </>,
      ),
    );
    expect([...host.querySelectorAll('span')].map((el) => el.id)).toEqual([first, second]);

    act(() => root.unmount());
    host.remove();
  });
});
