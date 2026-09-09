import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
export async function generatedRoutes() {
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))).flat();
  }
  const files = await walk('dist');
  const routes = files.filter(file => file.endsWith('.html')).map(file => '/' + path.relative('dist', file).replaceAll('\\', '/').replace(/index\.html$/, '')).sort();
  if (!routes.length) throw new Error('No generated HTML routes: build first.');
  if (routes.some(route => route.includes('first-therapy-session'))) throw new Error('Placeholder draft was published.');
  return routes;
}
if (process.argv[1]?.endsWith('routes.mjs')) {
  const routes = await generatedRoutes();
  await mkdir('.quality', { recursive: true });
  await writeFile('.quality/routes.json', JSON.stringify(routes, null, 2));
  console.log(`Recorded ${routes.length} generated routes.`);
}
