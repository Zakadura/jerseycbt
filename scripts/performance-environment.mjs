// Hosted runner image acceptance for the CI performance comparison.
//
// GitHub's windows-latest pool can serve two versions of the same image label
// during a rollout (observed 4-5 November 2026: 20261030.294.1 and
// 20261103.298.1 of windows-2025-vs2026). The reference medians were measured
// on `runnerImage`; `acceptedRunnerImages` lists further versions that were
// reviewed with recorded evidence of passing runs. Browser, platform,
// Lighthouse, launcher, settings and absolute budgets are still compared
// strictly elsewhere; this list never relaxes scores or accepts an unknown image.
const versionPattern = /^\d{8}\.\d+(\.\d+)?$/;

export function acceptedRunnerImages(baseline) {
  if (typeof baseline.runnerImage !== 'string' || !baseline.runnerImage) throw new Error('Performance baseline has no measured runnerImage.');
  const extra = baseline.acceptedRunnerImages ?? [];
  if (!Array.isArray(extra)) throw new Error('acceptedRunnerImages must be an array of reviewed image records.');
  const versions = [baseline.runnerImage];
  for (const entry of extra) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Each accepted runner image must be an object with version and evidence.');
    if (typeof entry.version !== 'string' || !versionPattern.test(entry.version)) throw new Error(`Accepted runner image has an invalid version: ${JSON.stringify(entry.version)}`);
    if (typeof entry.evidence !== 'string' || entry.evidence.trim().length < 20) throw new Error(`Accepted runner image ${entry.version} has no recorded evidence.`);
    if (versions.includes(entry.version)) throw new Error(`Accepted runner image ${entry.version} is listed twice.`);
    versions.push(entry.version);
  }
  return versions;
}

export function assertAcceptedRunnerImage(baseline, imageVersion) {
  const accepted = acceptedRunnerImages(baseline);
  if (typeof imageVersion !== 'string' || !accepted.includes(imageVersion)) {
    throw new Error(`Hosted runner image changed: reviewed comparison required. Runner reported ${JSON.stringify(imageVersion ?? null)}; accepted images: ${accepted.join(', ')}.`);
  }
  return imageVersion;
}
