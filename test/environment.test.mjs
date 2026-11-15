import assert from 'node:assert/strict'
import { createPond, configurePond, renderPond, resizePond, PALETTE } from '../src/core.js'
import { ENVIRONMENTS, paletteForEnvironment, resolveEnvironment } from '../src/environments.js'
import { paintEnvironmentFront, paintEnvironmentSurface } from '../src/environment.js'

assert.deepEqual(ENVIRONMENTS.map(({ id, label }) => [id, label]), [
  ['zen', 'Zen Garden'], ['moonlight', 'Moonlight'], ['autumn', 'Autumn'], ['sakura', 'Sakura Spring'], ['daylight', 'Daylight'],
])
assert(Object.isFrozen(ENVIRONMENTS) && ENVIRONMENTS.every(Object.isFrozen))
assert.equal(resolveEnvironment('midnight'), 'moonlight')
assert.equal(resolveEnvironment('rain'), 'zen')
assert.equal(resolveEnvironment('dusk'), 'autumn')
const countColors = (frame, lo, hi) => frame.colors.reduce((count, color) => count + (color >= lo && color <= hi), 0)
const barePond = (options = {}) => { const pond = createPond(280, 98, 1.6, options); pond.fish = []; return pond }
const sceneFrames = []
for (const { id } of ENVIRONMENTS) {
  const pond = barePond({ environment: id }), before = JSON.stringify(pond), frame = renderPond(pond)
  assert.equal(JSON.stringify(pond), before, `${id} painting is pure`)
  assert(frame.palette.length <= 256)
  assert(frame.palette.every(color => /^#[0-9a-f]{6}$/i.test(color)))
  assert.deepEqual(frame.palette.slice(15, 45), PALETTE.slice(15, 45))
  assert.deepEqual(frame.palette.slice(83, 91), PALETTE.slice(83, 91))
  assert(countColors(frame, 107, 118) > 150, `${id} has granite geometry`)
  assert(countColors(frame, 119, 130) > 100, `${id} has shaded moss`)
  assert(countColors(frame, 131, 138) > 35, `${id} has branching bark`)
  assert(countColors(frame, 45, 56) > 600, `${id} has multiple detailed lily clusters`)
  assert(countColors(frame, 59, 82) > 100, `${id} has layered lotus flowers`)
  assert.deepEqual(renderPond(pond), frame, 'Painting the same state is deterministic')
  assert.deepEqual(renderPond(barePond({ environment: id })), frame, 'Separate ponds reproduce the same seeded art')
  sceneFrames.push(frame)
}
for (let i = 0; i < sceneFrames.length; i++) for (let j = i + 1; j < sceneFrames.length; j++) {
  const differentCells = sceneFrames[i].chars.reduce((count, char, index) => count + (char !== sceneFrames[j].chars[index]), 0)
  assert(differentCells > 80, 'Scenes differ in their geometry and atmosphere as well as palette')
}
assert(countColors(sceneFrames[1], 163, 174) > 120, 'Moonlight has a segmented moon reflection')
assert(countColors(sceneFrames[2], 151, 162) > 100, 'Autumn has maple canopy and lobed leaves')
assert(countColors(sceneFrames[3], 139, 150) > countColors(sceneFrames[0], 139, 150), 'Sakura carries a denser flowering canopy')
const waterLuminance = frame => {
  let sum = 0, count = 0
  for (const index of frame.colors) if (index >= 91 && index <= 106) {
    const color = frame.palette[index]
    sum += .2126 * parseInt(color.slice(1, 3), 16) + .7152 * parseInt(color.slice(3, 5), 16) + .0722 * parseInt(color.slice(5, 7), 16)
    count++
  }
  return sum / count
}
assert(waterLuminance(sceneFrames[4]) > waterLuminance(sceneFrames[0]) + 45, 'Daylight water is materially brighter than Zen water')
assert(countColors(sceneFrames[4], 163, 174) > 150, 'Daylight has a broad broken sun-glint path and caustic flecks')
const sunny = barePond({ environment: 'daylight', particleDensity: 0, rippleIntensity: 0 })
const sunnyStill = renderPond(sunny)
sunny.time = 5
const sunnyLater = renderPond(sunny)
assert(sunnyStill.chars.reduce((count, char, i) => count + (char !== sunnyLater.chars[i] || sunnyStill.colors[i] !== sunnyLater.colors[i]), 0) > 80,
  'Sun glints shift over time without particles or ripple effects')

for (const id of ['zen', 'moonlight', 'autumn', 'sakura', 'daylight', 'midnight', 'rain', 'dusk']) {
  for (const timeOfDay of ['auto', 0, 12, 24]) {
    const palette = paletteForEnvironment(id, PALETTE, { waterColor: '#3a675c', timeOfDay })
    assert.deepEqual(palette.slice(15, 45), PALETTE.slice(15, 45), 'Water and lighting preserve warm koi shades')
    assert.deepEqual(palette.slice(83, 91), PALETTE.slice(83, 91), 'Water and lighting preserve Shusui blue')
  }
}
assert.throws(() => paletteForEnvironment('unknown', PALETTE), RangeError)
const zenNoon = paletteForEnvironment('zen', PALETTE, { timeOfDay: 12 })
assert.notDeepEqual(zenNoon, paletteForEnvironment('zen', PALETTE, { timeOfDay: 0 }))
assert.notDeepEqual(zenNoon.slice(0, 15), paletteForEnvironment('zen', PALETTE, { waterColor: '#7b2446', timeOfDay: 12 }).slice(0, 15))
assert.notDeepEqual(paletteForEnvironment('daylight', PALETTE, { waterColor: '#7b2446' }).slice(91, 107), sceneFrames[4].palette.slice(91, 107))
assert(waterLuminance({ colors: Uint8Array.of(98), palette: paletteForEnvironment('daylight', PALETTE) }) >
  waterLuminance({ colors: Uint8Array.of(98), palette: paletteForEnvironment('daylight', PALETTE, { timeOfDay: 0 }) }), 'Daylight honors time of day')

const plants = barePond({ lilyDensity: 0, lotusCount: 0 }), leafCounts = []
for (const lilyDensity of [0, .3, .7, 1]) {
  configurePond(plants, { lilyDensity }); leafCounts.push(countColors(renderPond(plants), 45, 58))
}
assert.equal(leafCounts[0], 0)
assert(leafCounts[1] > leafCounts[0] && leafCounts[2] > leafCounts[1] && leafCounts[3] > leafCounts[2], 'Lily density changes the number of pads')
configurePond(plants, { lilies: false, lotus: false })
assert.equal(countColors(renderPond(plants), 45, 82), 0, 'Legacy plant toggles override density and counts')
const lotusCounts = []
for (let lotusCount = 0; lotusCount <= 6; lotusCount++) {
  configurePond(plants, { lotus: true, lotusCount }); lotusCounts.push(countColors(renderPond(plants), 59, 82))
}
assert(lotusCounts.every((count, i) => !i || count > lotusCounts[i - 1]), 'Every requested lotus adds visible flower geometry')

const quiet = barePond({ particleDensity: 0, rippleIntensity: 0, causticIntensity: 0 }), still = renderPond(quiet)
quiet.time = 18
assert.deepEqual(renderPond(quiet), still, 'Zero particles and ripples remove Zen surface movement')
configurePond(quiet, { particleDensity: 1 })
assert.notDeepEqual(renderPond(quiet), still, 'Particles have a visible effect')
const optics = createPond(280, 98, 1.6, { causticIntensity: 0, rippleIntensity: 0, particleDensity: 0 })
const withoutLight = renderPond(optics), motion = structuredClone(optics.fish), opticalTime = optics.time
configurePond(optics, { causticIntensity: 1 })
const lit = renderPond(optics)
assert(lit.colors.reduce((n, color, i) => n + (color !== withoutLight.colors[i] || lit.coverage[i] !== withoutLight.coverage[i]), 0) > 150, 'Light patterns affect a meaningful portion of the water')
optics.time = 3
assert.notDeepEqual(renderPond(optics).coverage, lit.coverage, 'Caustic filaments move over time')
optics.time = opticalTime
configurePond(optics, { waterClarity: 0 })
assert.notDeepEqual(renderPond(optics), lit, 'Water clarity changes submerged detail and light')
assert.deepEqual(optics.fish, motion, 'Water optics never alter fish state')
configurePond(optics, { causticIntensity: 0 })
const murky = renderPond(optics)
optics.time = 9
assert.deepEqual(renderPond(optics), murky, 'Disabling particles, ripples and caustics freezes Zen water')
const touch = createPond(280, 98, 1.6, { rippleIntensity: 1 })
touch.ripples = [{ x: 140, y: 45, age: .5, strength: 1, kind: 'touch' }]
const rippleWrites = []
paintEnvironmentSurface(touch, {}, (...cell) => rippleWrites.push(cell))
touch.ripples[0].age = 4
const fadedWrites = []
paintEnvironmentSurface(touch, {}, (...cell) => fadedWrites.push(cell))
const ringOpacity = writes => Math.max(...writes.filter(cell => cell[3] === 104).map(cell => cell[4]))
assert(ringOpacity(fadedWrites) < ringOpacity(rippleWrites) / 4, 'Visitor ripples decay visibly before disappearing')
for (const environment of ['moonlight', 'autumn', 'sakura', 'daylight']) {
  const pond = barePond({ environment, particleDensity: 0 }), frame = renderPond(pond), writes = []
  paintEnvironmentFront(pond, frame, (...cell) => writes.push(cell))
  assert.equal(writes.length, 0, 'Particle density zero omits atmosphere particles')
  configurePond(pond, { particleDensity: 1 })
  paintEnvironmentFront(pond, frame, (...cell) => writes.push(cell))
  assert(writes.length > 20, 'Particle density one adds preset-specific particles')
}
const cachePond = barePond(), original = renderPond(cachePond)
configurePond(cachePond, { seed: 183 }); cachePond.fish = []
assert.notDeepEqual(renderPond(cachePond).colors, original.colors, 'Seed changes invalidate scenery geometry')
configurePond(cachePond, { seed: 2026 }); cachePond.fish = []
assert.deepEqual(renderPond(cachePond), original, 'Returning to a seed reproduces its art')
configurePond(cachePond, { detail: 'balanced' })
assert.notDeepEqual(renderPond(cachePond).chars, original.chars, 'Detail changes canopy density and fine caustics')
resizePond(cachePond, 156, 110)
assert.equal(renderPond(cachePond).chars.length, 156 * 110, 'Resize invalidates cached arrays')
console.log('Environment art passed: five structural scenes, sunny water/glints, palette invariants, options, densities, seed/cache invalidation and purity.')
