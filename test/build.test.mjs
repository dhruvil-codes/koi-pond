import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Script, createContext } from 'node:vm'
import { build } from '../scripts/build.mjs'

test('standalone and browser distributions reproduce from source without dependencies or DOM globals', async () => {
  const before = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  await build()
  assert.equal(await readFile(new URL('../index.html', import.meta.url), 'utf8'), before, 'Committed demo must match source')
  const module = await import('../dist/koi-pond.js')
  assert.equal(typeof module.createKoiPond, 'function')
  assert.equal(typeof module.registerKoiPond, 'function')
  assert.equal(module.ENVIRONMENTS.length, 4)
  assert.equal(typeof module.parseConfig, 'function')
  assert.equal(typeof module.serializeConfig, 'function')
  const context = createContext({})
  new Script(await readFile(new URL('../dist/koi-pond.iife.js', import.meta.url), 'utf8')).runInContext(context)
  assert.equal(typeof context.KoiPond.createKoiPond, 'function')
  assert(!before.includes('POND_BUNDLE') && !before.includes('DEMO_SCRIPT'))
  const scripts = before.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi)
  assert(scripts && scripts.length === 2)
  assert(scripts.every(script => !/^<script[^>]*\bsrc=/i.test(script)), 'The standalone demo must have no external scripts')
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)))
  assert.equal(Object.keys(pkg.dependencies || {}).length, 0)
  assert.deepEqual(pkg.files, ['dist/', 'types/', 'index.html', 'examples/', 'docs/', 'LICENSE', 'README.md'])
})
