import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseAllowed } from '../scripts/release-guard.mjs';
import fs from 'node:fs';
import yaml from 'js-yaml';
import os from 'node:os';
import path from 'node:path';
import { saveCandidateReference } from '../scripts/performance-reference.mjs';
const candidate = { event: 'workflow_dispatch', ref: 'refs/heads/Master', sha: 'a'.repeat(40), approvedSha: 'a'.repeat(40) };
test('only actual manual Master event with an approved immutable matching SHA is eligible', () => {
  assert.equal(releaseAllowed(candidate), true);
  for (const change of [{ event: 'push' }, { ref: 'refs/heads/feature' }, { sha: 'b'.repeat(40) }, { approvedSha: '' }, { approvedSha: 'Master' }]) assert.equal(releaseAllowed({ ...candidate, ...change }), false);
});
test('workflow drafts retain real quality dependencies and bounded permissions', () => {
  const read = file => yaml.load(fs.readFileSync(file, 'utf8'));
  const rehearsal = read('.github/workflows/rehearsal.yml');
  const quality = read('.github/workflows/quality.yml');
  const release = read('quality/release-workflow.draft.yml');
  const paused = read('quality/deploy-paused.yml');
  const reference = read('.github/workflows/performance-reference.yml');
  assert.deepEqual(read('.github/workflows/deploy.yml'), paused);
  assert.ok(reference.on.pull_request);
  assert.equal(reference.permissions.contents, 'read');
  assert.deepEqual(Object.keys(reference.jobs), ['measure']);
  assert.ok(reference.jobs.measure.steps.some(step => step.run === 'node scripts/performance.mjs --collect-reference'));
  assert.ok(rehearsal.on.pull_request);
  assert.equal(rehearsal.permissions.contents, 'read');
  assert.equal(quality.permissions.contents, 'read');
  assert.equal(rehearsal.jobs.marker.needs, 'quality');
  assert.equal(rehearsal.jobs.quality.uses, release.jobs.quality.uses);
  assert.deepEqual(release.jobs.deploy.needs, ['guard', 'quality']);
  assert.equal(release.jobs.deploy.if, "${{ github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/Master' && github.sha == inputs.approved_sha }}");
  const guardCheckout = release.jobs.guard.steps.filter(step => step.uses?.startsWith('actions/checkout@'));
  assert.equal(guardCheckout.length, 1);
  assert.equal(guardCheckout[0].with.ref, '${{ github.sha }}');
  assert.equal(release.jobs.quality.needs, 'guard');
  assert.equal(release.jobs.deploy.steps.some(step => /build/.test(step.run || '')), false);
  assert.ok(release.jobs.deploy.steps.some(step => step.with?.name === 'checked-site'));
  const guard = release.jobs.guard.steps.find(step => step.run === 'node scripts/release-guard.mjs');
  assert.deepEqual(guard.env, { RELEASE_EVENT: '${{ github.event_name }}', RELEASE_REF: '${{ github.ref }}', RELEASE_SHA: '${{ github.sha }}', APPROVED_SHA: '${{ inputs.approved_sha }}' });
  assert.equal(paused.permissions.contents, 'read');
  assert.deepEqual(Object.keys(paused.on), ['workflow_dispatch']);
  assert.deepEqual(Object.keys(paused.jobs), ['notice']);
  assert.equal(quality.jobs.quality.steps.some(step => step.run === 'npm run quality'), true);
  assert.equal(quality.jobs.quality.steps.some(step => step.if === '${{ inputs.inject_failure }}' && step.run === 'exit 1'), true);
  const siteUploads = quality.jobs.quality.steps.filter(step => step.with?.name === 'checked-site');
  assert.equal(siteUploads.length, 1);
  assert.match(siteUploads[0].uses, /^actions\/upload-artifact@/);
  assert.equal(siteUploads[0].with.path, 'dist/');
  assert.ok([undefined, 'success()', '${{ success() }}'].includes(siteUploads[0].if), 'checked-site must only upload after successful preceding checks');
  const requiredIndex = quality.jobs.quality.steps.findIndex(step => step.run === 'npm run quality');
  const failureIndex = quality.jobs.quality.steps.findIndex(step => step.name === 'Deliberate rehearsal failure');
  assert.ok(quality.jobs.quality.steps.indexOf(siteUploads[0]) > failureIndex && failureIndex > requiredIndex);
});

test('a below-budget measurement still saves an explicitly unaccepted candidate', async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'jerseycbt-reference-'));
  try {
    await saveCandidateReference({ output, runs: [70, 72, 71].map(performance => ({ route: '/', lighthouseVersion: '12.8.2', browser: 'synthetic', settings: {}, scores: { performance } })), sourceSha: 'a'.repeat(40), platform: 'win32', runnerImage: 'synthetic', launcherVersion: '1.2.1', assertionExitCode: 1 });
    const evidence = JSON.parse(fs.readFileSync(path.join(output, 'candidate-baseline.json'), 'utf8'));
    assert.equal(evidence.medians['/'], 71);
    assert.equal(evidence.absoluteBudgets.passed, false);
    assert.equal(evidence.absoluteBudgets.advisory, true);
    assert.match(evidence.provenance, /not automatically accepted/);
  } finally {
    fs.unlinkSync(path.join(output, 'candidate-baseline.json'));
    fs.rmdirSync(output);
  }
});
