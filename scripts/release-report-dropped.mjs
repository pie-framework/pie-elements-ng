// Names the packages a develop run selected for a `next` snapshot and did not publish, so a
// merged change can never miss `next` unflagged (PIE-1073, PIE-1121).
//
// Takes what the run selected (release-version-snapshot.mjs --selection-out) and what it still
// left unpublished: the selection minus the packages the publish script reported as published.
// The workflow computes the second list from the publish manifest rather than by asking npm
// again, whose replicas can lag a fresh publish.
//
// A dropped package is not lost. Snapshots commit nothing, so npm still points at the commit the
// package was last published from, and the next merge into develop selects it again. The report
// exists so the gap is visible until then, and so a re-run can close it sooner.
//
// Exits non-zero only when the job is otherwise succeeding. A green run that dropped a release
// is the silent failure this exists to stop; a run that is already red is red for the underlying
// reason, and here the list is the point rather than the exit code.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function readSelection(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function planDroppedReport({
  intent,
  remaining,
  branch = 'the branch',
  jobStatus = 'success',
}) {
  if (intent === null) {
    return {
      dropped: [],
      failing: false,
      lines: ['No release intent was recorded for this run; nothing to check.'],
    };
  }

  const outstanding = new Set(remaining ?? []);
  const dropped = intent.filter((name) => outstanding.has(name));
  const succeeding = jobStatus === 'success';

  const lines = [];
  if (dropped.length > 0) {
    lines.push(`${dropped.length} package(s) this run selected were not published from ${branch}:`);
    for (const name of dropped) lines.push(`  - ${name}`);
    lines.push(
      'Nothing was committed for them, so the next merge into the branch selects them again.'
    );
    lines.push('Re-run this workflow to publish them sooner.');
  } else if (succeeding) {
    lines.push(`All ${intent.length} package(s) this run set out to release are released.`);
  } else {
    // Every selected package is in the publish manifest, so the failure came after publishing:
    // provenance, the GitHub release or a notification. npm holds the snapshots.
    lines.push(
      `All ${intent.length} package(s) this run selected were published; the run failed in a later step.`
    );
  }

  return { dropped, failing: dropped.length > 0 && succeeding, lines };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--intent') args.intent = argv[++i];
    else if (argv[i] === '--remaining') args.remaining = argv[++i];
    else if (argv[i] === '--branch') args.branch = argv[++i];
    else if (argv[i] === '--job-status') args.jobStatus = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = planDroppedReport({
    intent: args.intent ? readSelection(args.intent) : null,
    remaining: args.remaining ? readSelection(args.remaining) : [],
    branch: args.branch,
    jobStatus: args.jobStatus,
  });

  for (const line of report.lines) {
    if (report.failing) console.error(line);
    else console.log(line);
  }

  if (report.failing) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
