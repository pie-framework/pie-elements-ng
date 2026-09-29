// Names the releases a run lost, so a merged change can never reach develop unpublished and
// unflagged (PIE-1073).
//
// Takes what the run set out to release and what still holds unreleased code once the run is
// over, both produced by release-synthesize-changesets.mjs --selection-out. A package in both
// was dropped: its code is on the branch with no published version behind it.
//
// Packages that appear only in the second list became outstanding while the run was in flight.
// Those are reported and not treated as a fault — the merge that introduced them triggers its
// own Release run, which releases them.
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
      arrivedDuringRun: [],
      failing: false,
      lines: ['No release intent was recorded for this run; nothing to check.'],
    };
  }

  const outstanding = new Set(remaining ?? []);
  const intended = new Set(intent);
  const dropped = intent.filter((name) => outstanding.has(name));
  const arrivedDuringRun = [...outstanding].filter((name) => !intended.has(name)).sort();
  const succeeding = jobStatus === 'success';

  const lines = [];
  if (arrivedDuringRun.length > 0) {
    lines.push(
      `Outstanding from merges that landed during this run, released by their own run: ${arrivedDuringRun.join(', ')}`
    );
  }

  if (dropped.length > 0) {
    lines.push(
      `${dropped.length} package(s) this run set out to release are still unreleased on ${branch}:`
    );
    for (const name of dropped) lines.push(`  - ${name}`);
    lines.push(
      'Their code is on the branch with no published version behind it. Re-run this workflow to release them.'
    );
  } else if (succeeding) {
    lines.push(`All ${intent.length} package(s) this run set out to release are released.`);
  } else {
    // The version bump reached the branch but the run failed after that — during publish, or
    // during the rebuilt build behind it. This is the one gap the self-healing selection cannot
    // close: every intended package now has a newer version on the branch, so later runs read
    // them as released and will not reconsider them, while npm may never have received the
    // tarballs. Say that plainly instead of reporting them as released.
    lines.push(
      `This run failed with the version bump already on ${branch}, so the ${intent.length} package(s) it`
    );
    lines.push(
      'set out to release look released to every later run and will not be picked up again:'
    );
    for (const name of intent) lines.push(`  - ${name}`);
    lines.push(
      'Check whether they reached npm. If they did not, re-run this workflow, or run it manually with'
    );
    lines.push('release_intent=publish and force_publish=true to publish the bumped versions.');
  }

  return { dropped, arrivedDuringRun, failing: dropped.length > 0 && succeeding, lines };
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
