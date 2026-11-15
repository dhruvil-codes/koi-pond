import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_OPTIONS, validateOptions, serializeConfig, parseConfig, randomizeConfig } from '../src/config.js'
import { generateSnippet, INSTALL_COMMAND } from '../demo/snippets.js'

test('every playground control validates ranges and serializes exactly through JSON and URL hashes', () => {
  const options = validateOptions({ environment: 'sakura', fishCount: 30, speed: .1, fishSize: 1.8, varieties: ['shusui', 'sanke'], behavior: 'school', waterColor: '#aAbBcC', waterClarity: .35, causticIntensity: .9, lilyDensity: 0, lotusCount: 6, particleDensity: 1, rippleIntensity: 2, timeOfDay: 19.25, seed: 4294967295, detail: 'balanced', paused: true, interactive: false })
  const encoded = serializeConfig(options)
  assert.deepEqual(parseConfig(encoded), options)
  assert.deepEqual(parseConfig(JSON.stringify(options)), options)
  const url = new URL('https://example.com/pond/#pond=' + encodeURIComponent(encoded))
  assert.deepEqual(parseConfig(new URLSearchParams(url.hash.slice(1)).get('pond')), options)
  assert.equal(options.waterColor, '#aabbcc')
  for (const invalid of [{ fishCount: 31 }, { speed: .09 }, { speed: 3.01 }, { fishSize: NaN }, { lotusCount: 6.5 }, { particleDensity: 1.1 }, { rippleIntensity: -1 }, { timeOfDay: 25 }, { seed: -1 }, { waterColor: 'red' }, { varieties: [] }, { varieties: ['ogon', 'ogon'] }, { behavior: 'teleport' }, { mystery: 1 }]) assert.throws(() => validateOptions(invalid))
  for (const value of ['{', 'null', '[]', '3', JSON.stringify({ version: 2, options: {} }), JSON.stringify({ version: 1, options: {}, extra: 1 })]) assert.throws(() => parseConfig(value))
  assert.throws(() => parseConfig(' '.repeat(10001)))
  assert.throws(() => validateOptions({}, { unknown: true }))
  assert.throws(() => validateOptions({}, null))
  const varieties = ['kohaku']; const cloned = validateOptions({ varieties }); varieties.push('ogon')
  assert.deepEqual(cloned.varieties, ['kohaku'])
  assert(Object.isFrozen(DEFAULT_OPTIONS) && Object.isFrozen(DEFAULT_OPTIONS.varieties))
  assert.equal(parseConfig(serializeConfig({ environment: 'daylight' })).environment, 'daylight')
  assert.equal(parseConfig('{"version":1,"options":{"fishCount":3}}').waterClarity, .8, 'Older configurations receive water defaults')
  for (const key of ['waterClarity', 'causticIntensity']) for (const value of [-.01, 1.01, null, NaN, Infinity]) assert.throws(() => validateOptions({ [key]: value }))
})

test('random configurations are valid and reproducible, and every integration output contains the exact options', () => {
  assert.deepEqual(randomizeConfig(123), randomizeConfig(123))
  assert.notDeepEqual(randomizeConfig(123), randomizeConfig(124))
  for (let seed = 0; seed < 25; seed++) {
    const config = randomizeConfig(seed)
    assert.deepEqual(validateOptions(config), config)
    for (const target of ['javascript', 'html', 'react', 'next']) {
      const code = generateSnippet(config, target)
      const start = code.indexOf('const config = ') + 'const config = '.length
      const end = code.indexOf(';', start)
      assert.deepEqual(JSON.parse(code.slice(start, end)), config, `${target} must include every current setting`)
      assert(code.includes('createKoiPond'))
    }
    assert(generateSnippet(config, 'next').startsWith("'use client'"))
    assert(generateSnippet(config, 'react').includes('return () => pond.destroy()'))
  }
  assert(INSTALL_COMMAND.includes('#v0.4.0'))
  assert(INSTALL_COMMAND.includes('git+https://github.com/dhruvil-codes/koi-pond.git'))
})
