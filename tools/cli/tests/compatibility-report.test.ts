import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  deriveStaticBrowserEsmReport,
  formatCompatibilityReportLastAnalyzed,
  loadCompatibilityReport,
} from '../src/utils/compatibility.js';

describe('loadCompatibilityReport', () => {
  it('normalizes static browser ESM reports for upstream sync filtering', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-compat-report-'));
    const reportPath = join(rootDir, 'report.json');

    await writeFile(
      reportPath,
      JSON.stringify(
        {
          schemaVersion: 2,
          contract: 'static-browser-esm',
          browserEsmReady: ['categorize', 'multiple-choice'],
          browserEsmUnsupported: {
            'math-inline': {
              reason: 'Excluded from the root build',
            },
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    const report = await loadCompatibilityReport(reportPath);

    expect(report.elements).toEqual(['categorize', 'multiple-choice']);
    expect(report.pieLibPackages).toEqual([]);
    expect(report.blockedElements).toEqual({
      'math-inline': ['Excluded from the root build'],
    });
    expect(report.lastAnalyzed).toBe('unknown');
    expect(formatCompatibilityReportLastAnalyzed(report)).toBe('unknown');
  });
});

describe('deriveStaticBrowserEsmReport', () => {
  it('derives browser-ready element slugs from local React and Svelte package exports', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'pie-cli-browser-esm-report-'));
    const reactDir = join(rootDir, 'packages', 'elements-react', 'multiple-choice');
    const svelteDir = join(rootDir, 'packages', 'elements-svelte', 'simple-cloze');
    const blockedDir = join(rootDir, 'packages', 'elements-react', 'not-browser-ready');
    await mkdir(reactDir, { recursive: true });
    await mkdir(svelteDir, { recursive: true });
    await mkdir(blockedDir, { recursive: true });

    await writeFile(
      join(reactDir, 'package.json'),
      JSON.stringify({
        name: '@pie-element/multiple-choice',
        exports: {
          './browser/delivery': { default: './dist/browser/delivery/index.js' },
          './browser/controller': { default: './dist/browser/controller/index.js' },
        },
      }),
      'utf-8'
    );
    await writeFile(
      join(svelteDir, 'package.json'),
      JSON.stringify({
        name: '@pie-element/simple-cloze',
        exports: {
          './browser/delivery': { default: './dist/browser/delivery/index.js' },
          './browser/controller': { default: './dist/browser/controller/index.js' },
        },
      }),
      'utf-8'
    );
    await writeFile(
      join(blockedDir, 'package.json'),
      JSON.stringify({
        name: '@pie-element/not-browser-ready',
        exports: {
          './delivery': { default: './dist/delivery/index.js' },
        },
      }),
      'utf-8'
    );

    const report = await deriveStaticBrowserEsmReport(rootDir);

    expect(report.browserEsmReady).toEqual(['multiple-choice', 'simple-cloze']);
    expect(report.browserEsmUnsupported).toEqual({
      'not-browser-ready': {
        reason: 'Missing browser ESM exports: ./browser/delivery, ./browser/controller',
      },
    });
  });
});
