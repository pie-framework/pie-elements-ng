import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createTrackedCompatibilityReport,
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

describe('createTrackedCompatibilityReport', () => {
  it('removes volatile runtime probe fields from the tracked report', () => {
    const report = createTrackedCompatibilityReport({
      elements: ['categorize'],
      pieLibPackages: ['config-ui'],
      blockedElements: {},
      elementDetails: {},
      pieLibDetails: {},
      esmPlayerReady: ['categorize'],
      esmValidation: {},
      esmPlayerValidationEnabled: true,
      esmRuntimeValidationEnabled: true,
      esmRuntimeCdnBaseUrl: 'https://esm.sh',
      esmRuntimeValidation: {
        categorize: {
          compatible: false,
          cdnBaseUrl: 'https://esm.sh',
          version: '13.1.0',
          entryOk: false,
          controllerOk: false,
          entryParseOk: false,
          controllerParseOk: false,
          errors: ['fetch https://esm.sh/@pie-element/categorize@13.1.0 -> 404'],
        },
      },
      lastAnalyzed: '2026-06-04T03:35:33.325Z',
      summary: {
        totalElements: 1,
        compatibleElements: 1,
        blockedElements: 0,
        esmPlayerReady: 1,
        esmRuntimeReady: 0,
        totalPieLibPackages: 1,
        compatiblePieLibPackages: 1,
      },
    });

    expect(report.lastAnalyzed).toBe('unknown');
    expect(report.esmRuntimeValidationEnabled).toBeUndefined();
    expect(report.esmRuntimeCdnBaseUrl).toBeUndefined();
    expect(report.esmRuntimeValidation).toBeUndefined();
    expect(report.summary.esmRuntimeReady).toBeUndefined();
    expect(report.elements).toEqual(['categorize']);
    expect(report.pieLibPackages).toEqual(['config-ui']);
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
