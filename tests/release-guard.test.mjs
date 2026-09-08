import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseAllowed } from '../scripts/release-guard.mjs';
import fs from 'node:fs';
import yaml from 'js-yaml';
import os from 'node:os';
import path from 'node:path';
import { saveCandidateReference } from '../scripts/performance-reference.mjs';
const candidate = { event: 'workflow_dispatch', ref: 'refs/heads/Master', sha: 'a'.repeat(40), approvedSha: 'a'.repeat(40) };
const read = file => yaml.load(fs.readFileSync(file, 'utf8'));
const downloadPin = 'actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093';
const uploadPin = 'actions/upload-pages-artifact@7b1f4a764d45c48632c6b24a0339c27f5614fb0b';
const deployPin = 'actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e';
const releaseCondition = "${{ github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/Master' && github.sha == inputs.approved_sha }}";
const graph = () => ({
  rehearsal: read('.github/workflows/rehearsal.yml'),
  quality: read('.github/workflows/quality.yml'),
  release: read('quality/release-workflow.draft.yml'),
  packaging: read('.github/workflows/pages-package.yml'),
});

// Contract checks are also exercised against unsafe mutations below.
function assertReleaseGraph({ rehearsal, quality, release, packaging }) {
  assert.deepEqual(rehearsal.on, { pull_request: { branches: ['Master'] } });
  assert.deepEqual(Object.keys(release.on), ['workflow_dispatch']);
  assert.deepEqual(Object.keys(release.on.workflow_dispatch.inputs), ['approved_sha']);
  assert.equal(release.on.workflow_dispatch.inputs.approved_sha.required, true);
  assert.equal(release.on.workflow_dispatch.inputs.approved_sha.type, 'string');
  assert.deepEqual(Object.keys(packaging.on), ['workflow_call']);
  assert.deepEqual(Object.keys(packaging.on.workflow_call.inputs), ['inject_failure']);
  assert.equal(packaging.on.workflow_call.inputs.inject_failure.type, 'boolean');
  assert.equal(packaging.on.workflow_call.inputs.inject_failure.default, false);
  assert.equal(quality.on.workflow_call.inputs.inject_failure.default, false);
  assert.deepEqual(Object.keys(rehearsal.jobs), ['guard', 'quality', 'package', 'marker']);
  assert.deepEqual(Object.keys(release.jobs), ['guard', 'quality', 'package', 'deploy']);
  assert.deepEqual(Object.keys(packaging.jobs), ['package']);
  assert.deepEqual(release.concurrency, { group: 'jerseycbt-pages-production', 'cancel-in-progress': false });
  for (const workflow of [rehearsal, quality, packaging, release]) {
    assert.deepEqual(workflow.permissions, { contents: 'read' });
    for (const job of Object.values(workflow.jobs)) {
      const deploy = job === release.jobs.deploy;
      assert.ok([undefined, false].includes(job['continue-on-error']));
      assert.equal(job.if, deploy ? releaseCondition : undefined);
      assert.equal(job.secrets, undefined);
      if (!deploy) {
        assert.equal(job.environment, undefined);
        assert.ok(job.permissions === undefined || JSON.stringify(job.permissions) === JSON.stringify({ contents: 'read' }));
      }
      for (const step of job.steps || []) {
        assert.ok([undefined, false].includes(step['continue-on-error']));
        const evidenceOnly = workflow === quality && step.with?.name === 'quality-evidence-${{ inputs.inject_failure }}' && step.uses?.startsWith('actions/upload-artifact@');
        if (!evidenceOnly) assert.doesNotMatch(step.if || '', /always\(|failure\(|cancelled\(/);
      }
    }
  }
  // Required PR checks must run even if the independent guard fixture fails.
  assert.equal(rehearsal.jobs.quality.needs, undefined);
  assert.equal(quality.jobs.quality.needs, undefined);
  assert.equal(release.jobs.quality.needs, 'guard');
  for (const workflow of [rehearsal, release]) {
    assert.equal(workflow.jobs.quality.uses, './.github/workflows/quality.yml');
    assert.equal(workflow.jobs.quality.with.performance_baseline, 'quality/ci-performance-baseline.json');
    assert.deepEqual(workflow.jobs.package.needs, ['guard', 'quality']);
    assert.equal(workflow.jobs.package.uses, './.github/workflows/pages-package.yml');
    const checkout = workflow.jobs.guard.steps.filter(step => step.uses?.startsWith('actions/checkout@'));
    assert.equal(checkout.length, 1);
    assert.equal(checkout[0].with.ref, '${{ github.sha }}');
  }
  assert.deepEqual(rehearsal.jobs.marker.needs, ['guard', 'quality', 'package']);
  assert.equal(rehearsal.jobs.marker.steps.length, 1);
  assert.match(rehearsal.jobs.marker.steps[0].run, /^echo .*No deployment\./);
  const fixture = rehearsal.jobs.guard.steps.find(step => step.run === 'node scripts/release-guard.mjs');
  assert.deepEqual(fixture.env, { RELEASE_EVENT: 'workflow_dispatch', RELEASE_REF: 'refs/heads/Master', RELEASE_SHA: 'a'.repeat(40), APPROVED_SHA: 'a'.repeat(40) });
  assert.match(fixture.name, /fixture.*never publication authority/);
  assert.equal(typeof rehearsal.jobs.quality.with.inject_failure, 'boolean');
  assert.equal(typeof rehearsal.jobs.package.with.inject_failure, 'boolean');
  assert.equal(rehearsal.jobs.quality.with.inject_failure && rehearsal.jobs.package.with.inject_failure, false);
  assert.ok([undefined, false].includes(release.jobs.quality.with.inject_failure));
  assert.equal(release.jobs.package.with.inject_failure, false);
  const packageJob = packaging.jobs.package;
  assert.equal(packageJob['runs-on'], 'ubuntu-latest');
  assert.equal(packageJob.steps.length, 3);
  const [download, upload, record] = packageJob.steps;
  assert.equal(download.uses, downloadPin);
  assert.deepEqual(download.with, { name: 'checked-site', path: 'dist' }); // No token, repository or foreign run.
  assert.equal(upload.uses, uploadPin);
  assert.equal(upload.id, 'pages');
  assert.deepEqual(upload.with, { name: 'github-pages', path: "${{ inputs.inject_failure && 'missing-checked-site' || 'dist' }}", 'retention-days': 7 });
  for (const step of [download, upload, record]) assert.ok([undefined, 'success()', '${{ success() }}'].includes(step.if));
  assert.deepEqual(packageJob.outputs, { artifact_id: '${{ steps.pages.outputs.artifact_id }}' });
  assert.equal(packaging.on.workflow_call.outputs.artifact_id.value, '${{ jobs.package.outputs.artifact_id }}');
  assert.deepEqual(record.env, { SOURCE_SHA: '${{ github.sha }}', ARTIFACT_ID: '${{ steps.pages.outputs.artifact_id }}' });
  assert.match(record.run, /"\$SOURCE_SHA" "\$ARTIFACT_ID" >> "\$GITHUB_STEP_SUMMARY"/);
  assert.doesNotMatch(record.run, /\$\{\{/); // Data crosses through env, never direct shell interpolation.
  assert.deepEqual(release.jobs.deploy.needs, ['guard', 'quality', 'package']);
  assert.equal(release.jobs.deploy.environment, 'github-pages');
  assert.deepEqual(release.jobs.deploy.permissions, { pages: 'write', 'id-token': 'write' });
  assert.deepEqual(release.jobs.deploy.steps, [{ uses: deployPin, with: { artifact_name: 'github-pages' } }]);
  for (const job of [packageJob, release.jobs.deploy]) {
    assert.equal(job.steps.some(step => step.uses?.startsWith('actions/checkout@') || /\b(npm|npx|build|checkout)\b/.test(step.run || '')), false);
  }
}

test('only actual manual Master event with an approved immutable matching SHA is eligible', () => {
  assert.equal(releaseAllowed(candidate), true);
  for (const change of [{ event: 'push' }, { ref: 'refs/heads/feature' }, { sha: 'b'.repeat(40) }, { approvedSha: '' }, { approvedSha: 'Master' }]) assert.equal(releaseAllowed({ ...candidate, ...change }), false);
});
test('workflow drafts retain real quality dependencies and bounded permissions', () => {
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
  assertReleaseGraph(graph());
  assert.equal(rehearsal.jobs.quality.uses, release.jobs.quality.uses);
  assert.deepEqual(release.jobs.deploy.needs, ['guard', 'quality', 'package']);
  assert.equal(release.jobs.deploy.if, "${{ github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/Master' && github.sha == inputs.approved_sha }}");
  const guardCheckout = release.jobs.guard.steps.filter(step => step.uses?.startsWith('actions/checkout@'));
  assert.equal(guardCheckout.length, 1);
  assert.equal(guardCheckout[0].with.ref, '${{ github.sha }}');
  assert.equal(release.jobs.quality.needs, 'guard');
  assert.equal(release.jobs.deploy.steps.some(step => /build/.test(step.run || '')), false);
  assert.ok(read('.github/workflows/pages-package.yml').jobs.package.steps.some(step => step.with?.name === 'checked-site'));
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

test('normal and both isolated diagnostic transitions preserve the release contract', () => {
  for (const [qualityFailure, packageFailure] of [[false, false], [true, false], [false, true]]) {
    const workflows = graph();
    workflows.rehearsal.jobs.quality.with.inject_failure = qualityFailure;
    workflows.rehearsal.jobs.package.with.inject_failure = packageFailure;
    assertReleaseGraph(workflows);
  }
});

const unsafeMutations = {
  'both diagnostic fixtures true': g => { g.rehearsal.jobs.quality.with.inject_failure = true; g.rehearsal.jobs.package.with.inject_failure = true; },
  'required quality skipped behind a failed guard': g => { g.rehearsal.jobs.quality.needs = 'guard'; },
  'conditional required quality': g => { g.rehearsal.jobs.quality.if = '${{ false }}'; },
  'legacy marker skips packaging': g => { g.rehearsal.jobs.marker.needs = 'quality'; },
  'package skips quality': g => { g.rehearsal.jobs.package.needs = ['guard']; },
  'deploy skips package': g => { g.release.jobs.deploy.needs = ['guard', 'quality']; },
  'marker always runs': g => { g.rehearsal.jobs.marker.if = '${{ always() }}'; },
  'package continues after failure': g => { g.packaging.jobs.package['continue-on-error'] = true; },
  'archive step continues after failure': g => { g.packaging.jobs.package.steps[1]['continue-on-error'] = true; },
  'archive runs despite failed download': g => { g.packaging.jobs.package.steps[1].if = '${{ always() }}'; },
  'foreign-run download': g => { g.packaging.jobs.package.steps[0].with['run-id'] = 123; },
  'mutable download action': g => { g.packaging.jobs.package.steps[0].uses = 'actions/download-artifact@v4'; },
  'wrong checked artifact': g => { g.packaging.jobs.package.steps[0].with.name = 'unchecked-site'; },
  'mismatched Pages name': g => { g.packaging.jobs.package.steps[1].with.name = 'other-pages'; },
  'broken artifact output': g => { g.packaging.jobs.package.outputs.artifact_id = '${{ steps.other.outputs.artifact_id }}'; },
  'release quality failure fixture': g => { g.release.jobs.quality.with.inject_failure = true; },
  'release package failure fixture': g => { g.release.jobs.package.with.inject_failure = true; },
  'read-only rehearsal grants publication': g => { g.rehearsal.permissions.pages = 'write'; },
  'packaging takes production environment': g => { g.packaging.jobs.package.environment = 'github-pages'; },
  'rehearsal inherits secrets': g => { g.rehearsal.jobs.package.secrets = 'inherit'; },
  'mutable release checkout': g => { g.release.jobs.guard.steps[0].with.ref = 'Master'; },
  'publishing branch write': g => { g.release.jobs.deploy.permissions.contents = 'write'; },
  'active dispatch in packaging': g => { g.packaging.on.workflow_dispatch = {}; },
  'release push trigger': g => { g.release.on.push = { branches: ['Master'] }; },
};
for (const [name, mutate] of Object.entries(unsafeMutations)) {
  test(`workflow contract rejects ${name}`, () => {
    const workflows = graph();
    mutate(workflows);
    assert.throws(() => assertReleaseGraph(workflows), assert.AssertionError);
  });
}

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
