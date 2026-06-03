import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatCompatibilityReportLastAnalyzed, loadCompatibilityReport } from '../src/utils/compatibility.js';

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
