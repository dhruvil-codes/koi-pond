import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = new URL('../', import.meta.url)
const read = path => readFile(new URL(path, root), 'utf8')
// The source uses only local, single-line imports and named exports.
const stripModule = source => source.replace(/^import .*?\r?\n/gm, '').replace(/^export\s*\{[^\n]*\}\s*;?\r?$/gm, '').replace(/^export /gm, '')
export async function coreBundle() {
  return (await Promise.all(['src/environments.js', 'src/core.js'].map(read))).map(stripModule).join('\n')
}
export async function build() {
  const core = await coreBundle()
  const source = core + '\n' + (await Promise.all(['src/pond.js', 'src/element.js'].map(read))).map(stripModule).join('\n')
  const names = 'createKoiPond, registerKoiPond, KoiPondElement, ENVIRONMENTS'
  const register = "if (globalThis.customElements && globalThis.HTMLElement) registerKoiPond();"
  const banner = '/*! Koi Pond v0.1.0 | Copyright 2026 Dhruvil | MIT License */\n'
  const esm = `${banner}${source}\nexport { ${names} };\n${register}\n`
  const classic = `${banner}(() => {\n'use strict';\n${source}\nglobalThis.KoiPond = Object.freeze({ ${names} });\n${register}\n})();\n`
  await mkdir(new URL('dist/', root), { recursive: true })
  await writeFile(new URL('dist/koi-pond.js', root), esm)
  await writeFile(new URL('dist/koi-pond.iife.js', root), classic)
  const template = await read('demo/template.html'), demo = await read('demo/demo.js')
  const html = template.replace('<!-- POND_BUNDLE -->', `<script>${classic}</script>`).replace('<!-- DEMO_SCRIPT -->', `<script>${demo}</script>`)
  await writeFile(new URL('index.html', root), html)
  console.log(`Built ESM, classic browser script and standalone index.html (${Math.round(classic.length / 1024)} KB library, no dependencies).`)
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build()
