import { mkdir, copyFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
await mkdir(new URL('.local/site/dist/', root), { recursive: true })
for (const file of ['index.html', 'dist/koi-pond.js', 'dist/koi-pond.iife.js']) await copyFile(new URL(file, root), new URL('.local/site/' + file, root))
console.log('Prepared .local/site with only the standalone playground and browser distributions.')
