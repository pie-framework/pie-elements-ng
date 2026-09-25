import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planDroppedReport } from '../scripts/release-report-dropped.mjs';

const SCRIPT = join(import.meta.dirname, '..', 'scripts', 'release-report-dropped.mjs');

describe('dropped-release report', () => {
  it('passes when everything the run intended is released', () => {
    const report = planDroppedReport({
      intent: ['@pie-element/a', '@pie-element/b'],
      remaining: [],
      branch: 'develop',
    });

    expect(report.dropped).toEqual([]);
    expect(report.lines).toEqual(['All 2 package(s) this run set out to release are released.']);
  });

  it('names the packages the run intended to release and did not', () => {
    const report = planDroppedReport({
      intent: ['@pie-element/a', '@pie-element/b'],
      remaining: ['@pie-element/a'],
      branch: 'develop',
    });

    expect(report.dropped).toEqual(['@pie-element/a']);
    expect(report.lines.join('\n')).toContain('still unreleased on develop');
    expect(report.lines.join('\n')).toContain('- @pie-element/a');
  });

  // A merge landing mid-run is the normal case this must not cry wolf about: it triggers its own
  // Release run.
  it('separates work that arrived during the run from work the run dropped', () => {
    const report = planDroppedReport({
      intent: ['@pie-element/a'],
      remaining: ['@pie-element/c', '@pie-element/b'],
      branch: 'develop',
    });

    expect(report.dropped).toEqual([]);
    expect(report.arrivedDuringRun).toEqual(['@pie-element/b', '@pie-element/c']);
    expect(report.lines[0]).toContain('released by their own run: @pie-element/b, @pie-element/c');
  });

  it('says so rather than guessing when no intent was recorded', () => {
    const report = planDroppedReport({ intent: null, remaining: ['@pie-element/a'] });

    expect(report.dropped).toEqual([]);
    expect(report.lines).toEqual([
      'No release intent was recorded for this run; nothing to check.',
    ]);
  });

  // The gap the self-healing selection cannot close. The bump is on the branch, so every later
  // run reads these as released, but a run that died during publish may never have sent them to
  // npm. Reporting them as released is the one answer that must not appear here.
  it('does not call a failed run released just because the bump landed', () => {
    const report = planDroppedReport({
      intent: ['@pie-element/a', '@pie-element/b'],
      remaining: [],
      branch: 'develop',
      jobStatus: 'failure',
    });

    const text = report.lines.join('\n');
    expect(text).not.toContain('are released.');
    expect(text).toContain('will not be picked up again');
    expect(text).toContain('- @pie-element/a');
    expect(text).toContain('- @pie-element/b');
    expect(text).toContain('force_publish=true');
    // Already red for the underlying reason; this step only adds the list.
    expect(report.failing).toBe(false);
  });

  describe('exit status', () => {
    const runScript = async (
      intent: string[],
      remaining: string[],
      jobStatus: string
    ): Promise<{ code: number; output: string }> => {
      const dir = await mkdtemp(join(tmpdir(), 'pie-dropped-'));
      const intentPath = join(dir, 'intent.json');
      const remainingPath = join(dir, 'remaining.json');
      await writeFile(intentPath, JSON.stringify(intent), 'utf8');
      await writeFile(remainingPath, JSON.stringify(remaining), 'utf8');

      try {
        const output = execFileSync(
          process.execPath,
          [
            SCRIPT,
            '--intent',
            intentPath,
            '--remaining',
            remainingPath,
            '--branch',
            'develop',
            '--job-status',
            jobStatus,
          ],
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
        );
        return { code: 0, output };
      } catch (error) {
        const failure = error as { status: number; stdout: string; stderr: string };
        return { code: failure.status, output: `${failure.stdout}${failure.stderr}` };
      }
    };

    it('fails a run that would otherwise be green', async () => {
      const { code, output } = await runScript(['@pie-element/a'], ['@pie-element/a'], 'success');

      expect(code).toBe(1);
      expect(output).toContain('@pie-element/a');
    });

    // The run is already failing for whatever caused the drop; a second failure adds noise, the
    // list adds information.
    it('reports without failing a run that is already red', async () => {
      const { code, output } = await runScript(['@pie-element/a'], ['@pie-element/a'], 'failure');

      expect(code).toBe(0);
      expect(output).toContain('@pie-element/a');
    });

    it('succeeds when nothing was dropped', async () => {
      const { code } = await runScript(['@pie-element/a'], [], 'success');

      expect(code).toBe(0);
    });
  });
});
