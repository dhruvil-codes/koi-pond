import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Script, createContext } from 'node:vm'
import { build } from '../scripts/build.mjs'

test('standalone and browser distributions reproduce with no runtime dependencies or DOM globals', async () => {
  const before = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  const esmBefore = await readFile(new URL('../dist/koi-pond.js', import.meta.url), 'utf8')
  const classicBefore = await readFile(new URL('../dist/koi-pond.iife.js', import.meta.url), 'utf8')
  await build()
  assert.equal(await readFile(new URL('../index.html', import.meta.url), 'utf8'), before, 'Committed demo must match source')
  assert.equal(await readFile(new URL('../dist/koi-pond.js', import.meta.url), 'utf8'), esmBefore, 'ESM library output must stay unchanged')
  assert.equal(await readFile(new URL('../dist/koi-pond.iife.js', import.meta.url), 'utf8'), classicBefore, 'Classic library output must stay unchanged')
  const module = await import('../dist/koi-pond.js')
  assert.equal(typeof module.createKoiPond, 'function')
  assert.equal(typeof module.registerKoiPond, 'function')
  assert.equal(module.ENVIRONMENTS.length, 5)
  assert.equal(typeof module.parseConfig, 'function')
  assert.equal(typeof module.serializeConfig, 'function')
  const context = createContext({})
  new Script(await readFile(new URL('../dist/koi-pond.iife.js', import.meta.url), 'utf8')).runInContext(context)
  assert.equal(typeof context.KoiPond.createKoiPond, 'function')
  const htmlMarkup = before.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  assert(!['APP_STYLES', 'POND_BUNDLE', 'PLAYGROUND_BUNDLE'].some(marker => htmlMarkup.includes(`<!-- ${marker} -->`)))
  assert.match(before, /<style>[\s\S]*?<\/style>/, 'Playground CSS must be embedded')
  assert(before.includes('data:font/woff2;base64,') && !before.includes('__INTER_FONT__'), 'Inter must be inlined for offline use')
  assert(before.includes('Playground third-party notices') && before.includes('2026 Cloudflare'), 'Standalone UI must retain third-party licenses')
  assert(!/<link\b[^>]*rel=["']stylesheet/i.test(before), 'The standalone demo must not load an external stylesheet')
  const scripts = before.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi)
  assert(scripts && scripts.length === 2)
  for (const script of scripts) new Script(script.replace(/^<script[^>]*>|<\/script>$/g, ''))
  assert(scripts.every(script => !/^<script[^>]*\bsrc=/i.test(script)), 'The standalone demo must have no external scripts')
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)))
  assert.equal(Object.keys(pkg.dependencies || {}).length, 0)
  for (const hook of ['build', 'prepare', 'prepack', 'preinstall', 'install', 'postinstall']) {
    assert(!pkg.scripts?.[hook], `${hook} would make Git consumers prepare the package instead of using committed bundles`)
  }
  assert(!pkg.workspaces, 'Git consumers must not install a development workspace')
  assert(pkg.devDependencies.react && pkg.devDependencies['react-dom'] && pkg.devDependencies.esbuild)
  assert(pkg.devDependencies['@cloudflare/kumo'] && pkg.devDependencies.playwright)
  assert.deepEqual(pkg.files, ['dist/', 'types/', 'index.html', 'examples/', 'docs/', 'LICENSE', 'README.md'])
})
