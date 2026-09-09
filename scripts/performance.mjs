import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { saveCandidateReference } from './performance-reference.mjs';
const launcherVersion = JSON.parse(await fs.readFile(new URL('../node_modules/chrome-launcher/package.json', import.meta.url), 'utf8')).version;
const out = path.resolve('.quality/performance');
const collectReference = process.argv.includes('--collect-reference');
await fs.mkdir(out, { recursive: true });
await fs.mkdir('.quality/lighthouse-chrome', { recursive: true });
await fs.mkdir('.lighthouseci', { recursive: true });
for (const file of await fs.readdir('.lighthouseci')) if (/^lhr-\d+\.(json|html)$/.test(file)) await fs.unlink(path.join('.lighthouseci', file));
// CI needs its own explicitly accepted comparable profile; do not pretend a
// hosted runner is the workstation used for the M1 reference.
if (process.env.CI && !process.env.PERFORMANCE_BASELINE && !collectReference) throw new Error('CI performance reference is not accepted yet. Set PERFORMANCE_BASELINE to a reviewed runner-specific profile.');
const baseline = JSON.parse(await fs.readFile(process.env.PERFORMANCE_BASELINE || 'quality/performance-baseline.json', 'utf8'));
const server = spawn(process.execPath, ['scripts/serve.mjs'], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
let serverError;
server.on('error', error => { serverError = error; });
let chrome;
const runs = [];
const blocked = ['*plausible.io/*', '*calendly.com/*', '*openstreetmap.org/*'];
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Quality server did not become ready')), 10000);
    server.once('message', message => { if (message.ready) { clearTimeout(timer); resolve(); } });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Quality server exited: ${code}`)); });
    server.once('error', error => { clearTimeout(timer); reject(error); });
    if (serverError) { clearTimeout(timer); reject(serverError); }
  });
  chrome = await launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless', '--disable-background-networking', '--no-first-run'], userDataDir: path.resolve('.quality/lighthouse-chrome') });
  for (const route of Object.keys(baseline.medians)) for (let run = 1; run <= 3; run++) {
    const result = await lighthouse('http://127.0.0.1:4321' + route, { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], blockedUrlPatterns: blocked });
    const lhr = result.lhr;
    const name = (route === '/' ? 'home' : route.replaceAll('/', '_').replace(/^_|_$/g, '')) + '-' + run;
    await fs.writeFile(path.join(out, name + '.json'), result.report[0]);
    await fs.writeFile(path.join(out, name + '.html'), result.report[1]);
    await fs.writeFile(path.join('.lighthouseci', `lhr-${runs.length + 1}.json`), result.report[0]);
    const comparable = process.platform === baseline.platform && lhr.lighthouseVersion === baseline.lighthouseVersion && lhr.environment.hostUserAgent === baseline.browser && ['formFactor', 'throttlingMethod', 'throttling', 'screenEmulation', 'blockedUrlPatterns'].every(key => JSON.stringify(lhr.configSettings[key]) === JSON.stringify(baseline.settings[key]));
    runs.push({ route, run, comparable, browser: lhr.environment.hostUserAgent, lighthouseVersion: lhr.lighthouseVersion, settings: lhr.configSettings, scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])), warnings: lhr.runWarnings });
    console.log(JSON.stringify({ route, run, comparable, scores: runs.at(-1).scores }));
  }
} finally {
  if (chrome) await chrome.kill();
  server.kill();
  await fs.writeFile(path.join(out, 'summary.json'), JSON.stringify({ date: new Date().toISOString(), baseline: baseline.sourceSha, launcherVersion, runs }, null, 2));
}
// LHCI asserts the reports made with pinned Lighthouse 12.8.2; it does not
// collect using its older transitive Lighthouse version or upload reports.
if (runs.length !== Object.keys(baseline.medians).length * 3) throw new Error('Missing performance measurements');
const assertion = spawn(process.execPath, ['node_modules/@lhci/cli/src/cli.js', 'assert'], { stdio: 'inherit' });
const code = await new Promise((resolve, reject) => { assertion.on('error', reject); assertion.on('exit', resolve); });
if (collectReference) {
  await saveCandidateReference({ runs, sourceSha: process.env.GITHUB_SHA || 'local-uncommitted', platform: process.platform, runnerImage: process.env.ImageVersion || null, launcherVersion, assertionExitCode: code, output: out });
  console.log('Candidate reference collected; this is not a regression-gate pass or baseline approval.');
  process.exit(0);
}
if (code !== 0) throw new Error('Lighthouse CI budgets failed');
if (runs.some(run => !run.comparable)) throw new Error('Performance environment changed: comparison unresolved. Do not silently replace the baseline.');
if (process.env.CI && baseline.runnerImage !== process.env.ImageVersion) throw new Error('Hosted runner image changed: reviewed comparison required.');
for (const route of Object.keys(baseline.medians)) {
  const median = runs.filter(run => run.route === route).map(run => run.scores.performance).sort((a,b) => a-b)[1];
  if (median < baseline.medians[route] - 5) throw new Error(`Performance regression on ${route}: ${median} versus ${baseline.medians[route]}`);
}
