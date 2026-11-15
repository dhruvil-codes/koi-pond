import assert from 'node:assert/strict'
import { advance, configurePond, createPond, feed, renderPond, resizePond, PALETTE } from '../src/core.js'
import { fishLength, fishPaint } from '../src/fish.js'
import { ENVIRONMENTS, paletteForEnvironment } from '../src/environments.js'

function assertGeometry(pond) {
  for (const fish of pond.fish) {
    const gap = fishLength(pond, fish) / (fish.spine.length - 1)
    assert(Number.isFinite(fish.x + fish.y + fish.angle + fish.currentSpeed))
    assert(fish.x >= 0 && fish.x <= pond.columns && fish.y >= 0 && fish.y <= pond.rows)
    assert.equal(fish.spine[0].x, fish.x); assert.equal(fish.spine[0].y, fish.y)
    for (let i = 1; i < fish.spine.length; i++) {
      const a = fish.spine[i - 1], b = fish.spine[i]
      assert(Number.isFinite(b.x + b.y))
      assert(b.x >= -1e-8 && b.x <= pond.columns + 1e-8 && b.y >= -1e-8 && b.y <= pond.rows + 1e-8, 'Spines stay inside the banks')
      assert(Math.abs(Math.hypot(b.x - a.x, (b.y - a.y) * pond.aspect) - gap) < 1e-8, 'Spine joints remain connected')
    }
  }
}

const original = createPond(), same = createPond(), other = createPond(120, 44, 1.6, { seed: 17 })
assert.deepEqual(original.fish, same.fish, 'The default seed reproduces articulated geometry')
assert.notDeepEqual(original.fish.map(f => [f.x, f.y, f.phase]), other.fish.map(f => [f.x, f.y, f.phase]))
for (let i = 0; i < 120; i++) { advance(original, 1 / 60); advance(same, 1 / 60) }
assert.deepEqual(original.fish, same.fish, 'Seeded motion remains deterministic')
assert.deepEqual(original.fish.slice(0, 4).map(f => f.scale), [.62, .92, .72, .6])

feed(original, 55, 15)
const references = [...original.fish], geometry = structuredClone(original.fish), food = structuredClone(original.food), time = original.time
for (const environment of ['moonlight', 'autumn', 'sakura', 'daylight', 'zen', 'midnight', 'rain', 'dusk']) {
  configurePond(original, { environment, waterColor: '#123456', lilyDensity: .3, lotusCount: 4, particleDensity: .7, rippleIntensity: .2, timeOfDay: 18, lilies: false, lotus: false, detail: 'balanced' })
  renderPond(original)
  assert.deepEqual(original.fish, geometry, 'Environment updates and painting never alter fish state')
  original.fish.forEach((fish, index) => assert.equal(fish, references[index]))
  assert.deepEqual(original.food, food)
  assert.equal(original.time, time)
}

const varieties = ['kohaku'], options = { varieties }, cloned = createPond(120, 44, 1.6, options)
varieties.push('sanke')
assert.deepEqual(cloned.options.varieties, ['kohaku'], 'Input arrays cannot mutate the model')
const returned = configurePond(cloned, { speed: 2 })
returned.varieties.push('ogon')
assert.deepEqual(cloned.options.varieties, ['kohaku'], 'Returned arrays cannot mutate the model')
const beforeInvalid = structuredClone(cloned)
for (const partial of [{ fishCount: 31 }, { fishSize: 1.81 }, { seed: -1 }, { varieties: [] }, { varieties: ['sanke', 'sanke'] }, { behavior: 'dash' }, { speed: .09 }]) {
  assert.throws(() => configurePond(cloned, partial))
  assert.deepEqual(cloned, beforeInvalid, 'Invalid updates are atomic')
}

const grown = createPond(120, 44, 1.6, { fishCount: 1 })
const first = grown.fish[0], head = [first.x, first.y], oldLength = fishLength(grown, first)
configurePond(grown, { fishSize: 1.8, fishCount: 30, varieties: ['shusui'] })
assert.equal(grown.fish[0], first)
assert.deepEqual([first.x, first.y], head, 'Size updates keep fish positions')
assert.equal(fishLength(grown, first), oldLength * 1.8)
assert(grown.fish.every(f => f.variety === 'shusui'))
assert.equal(grown.fish.filter(f => f.scale >= .4).length, 4)
assertGeometry(grown)
configurePond(grown, { fishCount: 2 }); configurePond(grown, { fishCount: 30 })
assert.equal(grown.fish[0], first)
assert.equal(grown.fish.filter(f => f.scale >= .4).length, 4)
for (let i = 0; i < 900; i++) { advance(grown, 1 / 30); if (i % 60 === 0) assertGeometry(grown) }
resizePond(grown, 63, 92)
assertGeometry(grown)
for (let i = 0; i < 180; i++) advance(grown, 1 / 60)
assertGeometry(grown)

function fishColors(variety) {
  const pond = createPond(240, 90, 1.6, { fishCount: 1, varieties: [variety] }), cells = new Map()
  const frame = { columns: pond.columns, rows: pond.rows, colors: new Uint8Array(pond.columns * pond.rows), coverage: new Uint8Array(pond.columns * pond.rows) }
  fishPaint(pond, frame, (x, y, glyph, color) => { cells.set(`${Math.round(x)},${Math.round(y)}`, color) })
  return [...cells.values()]
}
const colorSets = ['kohaku', 'sanke', 'ogon', 'shusui'].map(fishColors)
assert(colorSets[0].some(c => c >= 23 && c <= 30), 'Kohaku has red patches')
assert(colorSets[1].filter(c => c >= 39 && c <= 44).length > colorSets[0].filter(c => c >= 39 && c <= 44).length, 'Sanke adds dark body patches')
assert(colorSets[2].some(c => c >= 31 && c <= 38) && !colorSets[2].some(c => c >= 23 && c <= 30), 'Ogon has gold scales')
assert(colorSets[3].some(c => c >= 83 && c <= 90), 'Shusui has a blue dorsal stripe')
assert.equal(PALETTE.length, 91)
for (const colors of colorSets) for (const color of new Set(colors)) {
  if (color === 0) continue
  if (color >= 91 && color <= 106) continue // Projected shadows and surface wakes use the scene water ramp.
  assert(color >= 15 && color <= 44 || color >= 83 && color <= 90, 'Fish body and fin colors retain their own palette families')
  for (const environment of ENVIRONMENTS) {
    const palette = paletteForEnvironment(environment.id, PALETTE, { waterColor: '#672b63', timeOfDay: 22 })
    assert.equal(palette[color], PALETTE[color], 'Water and lighting changes preserve fish asset colors')
  }
}

const paths = ['wander', 'school', 'circle'].map(behavior => createPond(120, 64, 1.6, { behavior }))
for (let i = 0; i < 900; i++) for (const pond of paths) advance(pond, 1 / 30)
const distance = (a, b) => a.fish.reduce((sum, fish, i) => sum + Math.hypot(fish.x - b.fish[i].x, fish.y - b.fish[i].y), 0) / a.fish.length
assert(distance(paths[0], paths[1]) > 5 && distance(paths[0], paths[2]) > 5 && distance(paths[1], paths[2]) > 5, 'Each behavior has a distinct trajectory')
const spread = pond => {
  const cx = pond.fish.reduce((sum, fish) => sum + fish.x, 0) / pond.fish.length
  const cy = pond.fish.reduce((sum, fish) => sum + fish.y, 0) / pond.fish.length
  return pond.fish.reduce((sum, fish) => sum + Math.hypot(fish.x - cx, (fish.y - cy) * pond.aspect), 0) / pond.fish.length
}
assert(spread(paths[1]) < spread(paths[0]) * .4, 'Schooling gathers koi into a cohesive group')
const alignment = Math.hypot(paths[1].fish.reduce((sum, fish) => sum + Math.cos(fish.angle), 0), paths[1].fish.reduce((sum, fish) => sum + Math.sin(fish.angle), 0)) / paths[1].fish.length
assert(alignment > .75, 'Schooling aligns headings')
assert(paths[2].fish.every(fish => {
  const x = (fish.x / paths[2].columns - .5) / .32, y = (fish.y / paths[2].rows - .5) / .29
  return x * Math.sin(fish.angle) - y * Math.cos(fish.angle) > .5
}), 'Circle behavior maintains a common direction around the pond')
for (const pond of paths) assertGeometry(pond)
for (const behavior of ['school', 'circle']) {
  const sixty = createPond(120, 64, 1.6, { behavior }), thirty = createPond(120, 64, 1.6, { behavior })
  for (let i = 0; i < 600; i++) advance(sixty, 1 / 60)
  for (let i = 0; i < 300; i++) advance(thirty, 1 / 30)
  assert(distance(sixty, thirty) < .04, `${behavior} stays stable across refresh rates`)
}
const oldTime = grown.time, oldFood = structuredClone(grown.food)
configurePond(grown, { seed: 17 })
assert.deepEqual(grown.fish, createPond(63, 92, 1.6, grown.options).fish, 'Explicit reseeding recreates the same layout')
assert.equal(grown.time, oldTime); assert.deepEqual(grown.food, oldFood)
console.log('Fish passed: deterministic layouts, distinct varieties/behaviors, size/count updates, connected bounds, environment invariants, and atomic options.')
