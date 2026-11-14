import assert from 'node:assert/strict'
import { configurePond, createPond, disturb, renderPond, PALETTE, ENVIRONMENTS } from '../src/core.js'

for (const [columns, rows] of [[156, 110], [280, 98], [480, 170]]) {
  const pond = createPond(columns, rows), before = JSON.stringify(pond)
  const frame = renderPond(pond)
  assert.equal(JSON.stringify(pond), before, 'Drawing must not advance or modify the simulation')
  assert(frame.chars.every(c => c >= 32 && c <= 126), 'All detail remains printable ASCII')
  assert(frame.colors.every(c => c < PALETTE.length), 'Every surface must have a valid color')
  const leaves = frame.colors.filter(c => c >= 45 && c <= 56)
  assert(leaves.length > columns * .5, 'Lily pads must survive portrait and desktop rasterization')
  assert(new Set(leaves).size >= 7, 'Leaf rims, veins and shading must retain tonal detail')
  assert(frame.colors.some(c => c >= 15 && c < 23), 'Ivory koi must remain visible')
  assert(frame.colors.some(c => c >= 23 && c < 31), 'Red koi must remain visible')
  assert(frame.colors.some(c => c >= 31 && c < 39), 'Amber koi must remain visible')
  assert(frame.colors.some(c => c >= 59 && c < 71), 'The lotus retains its pink outer petals')
  assert(frame.colors.some(c => c >= 71 && c < 77), 'The lotus retains its ivory inner petals')
  assert(frame.colors.some(c => c >= 77), 'The lotus retains its golden seed head')
}

// The last body joint is a projection boundary, not the centre of a circular tail.
const isolated = createPond(336, 120)
const fish = isolated.fish[1]
isolated.fish = [fish]
fish.x = 170; fish.y = 60; fish.angle = 0; fish.swimPhase = 0
const length = 25 * fish.scale * isolated.columns / 112
fish.spine = Array.from({ length: 22 }, (_, i) => ({ x: fish.x - length * i / 21, y: fish.y }))
const frame = renderPond(isolated), end = fish.spine.at(-1)
for (let y = Math.floor(end.y) - 5; y <= Math.ceil(end.y) + 5; y++) {
  for (let x = Math.floor(end.x) - 10; x < Math.floor(end.x) - 2; x++) {
    assert.equal(frame.coverage[y * frame.columns + x], 0, 'Tail material must not wrap behind its final joint')
  }
}
assert(frame.coverage.some(c => c > 200), 'Tail check must include a rendered koi')

const ripplePond = createPond(280, 100)
ripplePond.fish = []
disturb(ripplePond, 140, 50)
ripplePond.ripples[0].age = 1
const ripple = renderPond(ripplePond), radius = 280 * .078
assert.equal(ripple.colors[50 * 280 + Math.round(140 + radius)], 3, 'Ripple reaches its horizontal radius')
assert.equal(ripple.colors[Math.round(50 + radius / ripplePond.aspect) * 280 + 140], 3, 'Ripple respects character aspect ratio')
assert(ripple.colors[50 * 280 + Math.round(140 + radius * .5)] < 2, 'Ripple traces a ring rather than filling the water')

assert.deepEqual(ENVIRONMENTS.map(environment => environment.id), ['midnight', 'rain', 'dusk'])
const midnight = createPond(100, 40), baseFrame = renderPond(midnight)
assert.deepEqual(baseFrame.palette, PALETTE, 'Midnight palette preserves original color mapping')
const rain = createPond(100, 40, 1.6, { environment: 'rain', lilies: false, lotus: false })
rain.fish = []
const rainBefore = JSON.stringify(rain), rainFrame = renderPond(rain)
assert.equal(JSON.stringify(rain), rainBefore, 'Rain art must not mutate simulation state')
assert.notDeepEqual(rainFrame.palette, PALETTE, 'Rain uses a cool teal palette')
assert(rainFrame.colors.some(color => color === 3 || color === 4), 'Rain draws gentle ring patterns')
configurePond(rain, { environment: 'dusk' })
const dusk = renderPond(rain)
assert.notDeepEqual(dusk.palette, rainFrame.palette, 'Dusk selects its own warm palette')
assert(dusk.colors.some(color => color === 59 || color === 60), 'Dusk adds small petals')
const plants = createPond(140, 60)
const withPlants = renderPond(plants)
configurePond(plants, { lilies: false, lotus: false })
const bare = renderPond(plants)
assert(withPlants.colors.some(color => color >= 45 && color <= 56), 'Lily pads render when enabled')
assert(withPlants.colors.some(color => color >= 59), 'Lotus renders when enabled')
assert(!bare.colors.some(color => color >= 45 && color <= 56), 'Lily pads disappear when disabled')
assert(!bare.colors.some(color => color >= 59), 'Lotus disappears when disabled')
console.log('Artwork passed: portrait/desktop detail, shaded leaves, layered lotus and seed head, koi colors, pure ASCII, render purity, bounded tails and elliptical ripples.')
