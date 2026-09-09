import { pathToFileURL } from 'node:url';
export function releaseAllowed({ event, ref, sha, approvedSha }) {
  return event === 'workflow_dispatch' && ref === 'refs/heads/Master' && /^[a-f0-9]{40}$/.test(approvedSha || '') && sha === approvedSha;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const allowed = releaseAllowed({ event: process.env.RELEASE_EVENT, ref: process.env.RELEASE_REF, sha: process.env.RELEASE_SHA, approvedSha: process.env.APPROVED_SHA });
  console.log(allowed ? 'Release context accepted' : 'Release context rejected');
  if (!allowed) process.exitCode = 1;
}
