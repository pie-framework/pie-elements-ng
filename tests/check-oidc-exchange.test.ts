import { describe, expect, it } from 'vitest';
import {
  collectExchangeFailures,
  exchangeUrl,
  remedyFor,
  selectPackages,
} from '../scripts/check-oidc-exchange.mjs';

const publishable = [
  { name: '@pie-lib/render-ui', workflow: 'release.yml' },
  { name: '@pie-lib/style-utils', workflow: 'release.yml' },
];

describe('check-oidc-exchange', () => {
  it('encodes the scope slash the way npm does', () => {
    expect(exchangeUrl('@pie-lib/style-utils')).toBe(
      'https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/%40pie-lib%2Fstyle-utils'
    );
  });

  it('checks the explicit selection, de-duplicated, when there is one', () => {
    expect(
      selectPackages({ selection: '@pie-lib/style-utils, @pie-lib/style-utils,', publishable })
    ).toEqual(['@pie-lib/style-utils']);
  });

  it('checks every publishable package when nothing is selected', () => {
    expect(selectPackages({ selection: '', publishable })).toEqual([
      '@pie-lib/render-ui',
      '@pie-lib/style-utils',
    ]);
    expect(selectPackages({ selection: undefined, publishable })).toHaveLength(2);
  });

  it('passes when every exchange is accepted', () => {
    const { failures, refused } = collectExchangeFailures([
      { name: 'a', status: 201 },
      { name: 'b', status: 200 },
    ]);
    expect(failures).toEqual([]);
    expect(refused).toEqual([]);
  });

  it('reports every refused package in one go, not just the first', () => {
    const { failures, refused } = collectExchangeFailures([
      {
        name: '@pie-lib/tools',
        status: 404,
        message: 'OIDC token exchange error - package not found',
      },
      { name: '@pie-lib/plot', status: 201 },
      { name: '@pie-lib/categorize', status: 404 },
    ]);
    expect(refused).toEqual(['@pie-lib/tools', '@pie-lib/categorize']);
    expect(failures).toHaveLength(2);
    expect(failures[0]).toContain('@pie-lib/tools');
    expect(failures[0]).toContain('package not found');
  });

  it('separates network errors and other statuses from refused records', () => {
    const { failures, refused } = collectExchangeFailures([
      { name: 'a', status: 0, message: 'ECONNRESET' },
      { name: 'b', status: 500 },
    ]);
    expect(refused).toEqual([]);
    expect(failures[0]).toContain('could not reach npm');
    expect(failures[1]).toContain('unexpected exchange status 500');
  });

  it('prints the revoke and re-create commands only for refused packages', () => {
    expect(remedyFor([])).toBe('');
    const text = remedyFor(['@pie-lib/tools']);
    expect(text).toContain('npm trust revoke @pie-lib/tools --id');
    expect(text).toContain('--allow-publish --allow-stage-publish');
    expect(text).toContain('not only the failed jobs');
  });
});
