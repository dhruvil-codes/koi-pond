import { readFile, writeFile } from 'node:fs/promises';
import { coreBundle } from '../../scripts/build.mjs';
const model = await coreBundle();
const adapter = await readFile(new URL('./backdrop-adapter.js', import.meta.url), 'utf8');
const bundled = '// Local Midnight Koi backdrop. Built from the shared pond model.\n' + model + '\n' + adapter;
await writeFile(new URL('./midnight-koi-backdrop.js', import.meta.url), bundled);
console.log('Built integrations/t3/midnight-koi-backdrop.js from the current shared model.');
