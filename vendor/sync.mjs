// Copies the shared style and text helper from a visualia checkout beside this one
// (or VISUALIA=<path>) and records its commit. Run after visualia/packages changes.
import { copyFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const here = new URL('./', import.meta.url).pathname;
const src = process.env.VISUALIA ?? `${here}../../visualia/`;
const files = { 'visualia.css': 'packages/style/', 'pool.css': 'packages/style/', 'text.js': 'packages/text/', 'check-text.mjs': 'packages/text/' };
for (const [name, dir] of Object.entries(files)) copyFileSync(`${src}${dir}${name}`, `${here}${name}`);
const commit = execFileSync('git', ['-C', src, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
writeFileSync(`${here}SOURCE`, `visualia ${commit}\n`);
console.log(`vendor/ from visualia ${commit}`);
