import fs from 'node:fs/promises';
import path from 'node:path';

// A measurement candidate is evidence for a decision, never a gate approval.
export async function saveCandidateReference({ runs, sourceSha, platform, runnerImage, launcherVersion, assertionExitCode, output }) {
  const reference = {
    sourceSha,
    provenance: 'Candidate measurement reference. Owner/coordinator review required; not automatically accepted.',
    platform, runnerImage, launcherVersion,
    lighthouseVersion: runs[0].lighthouseVersion,
    browser: runs[0].browser,
    settings: runs[0].settings,
    absoluteBudgets: { passed: assertionExitCode === 0, exitCode: assertionExitCode, advisory: true },
    medians: Object.fromEntries([...new Set(runs.map(run => run.route))].map(route => [route, runs.filter(run => run.route === route).map(run => run.scores.performance).sort((a,b) => a-b)[1]])),
  };
  await fs.writeFile(path.join(output, 'candidate-baseline.json'), JSON.stringify(reference, null, 2));
}
