import assert from 'node:assert/strict'
import { configurePond, createPond, disturb, renderPond, ENVIRONMENTS } from '../src/core.js'

for (const [columns, rows] of [[32, 16], [156, 110], [280, 98], [480, 170]]) for (const { id } of ENVIRONMENTS) {
  const pond = createPond(columns, rows, 1.6, { environment: id }), before = JSON.stringify(pond), frame = renderPond(pond)
  assert.equal(JSON.stringify(pond), before, 'Drawing must not advance or modify the simulation')
  assert.equal(frame.chars.length, columns * rows)
  assert.equal(frame.colors.length, columns * rows)
  assert.equal(frame.coverage.length, columns * rows)
  assert(frame.chars.every(c => c >= 32 && c <= 126), 'All detail remains printable ASCII')
  assert(frame.colors.every(c => c < frame.palette.length), 'Every surface has a valid palette color')
  if (columns >= 156) {
    const leaves = frame.colors.filter(c => c >= 45 && c <= 56)
    assert(leaves.length > columns * .5, 'Lily pads survive portrait and desktop rasterization')
    assert(new Set(leaves).size >= 7, 'Leaf rims, veins and shading retain tonal detail')
    assert(frame.colors.some(c => c >= 15 && c < 23), 'Ivory koi remain visible')
    assert(frame.colors.some(c => c >= 23 && c < 31), 'Red koi remain visible')
    assert(frame.colors.some(c => c >= 31 && c < 39), 'Amber koi remain visible')
    assert(frame.colors.some(c => c >= 59 && c < 71), 'Lotuses retain pink outer petals')
    assert(frame.colors.some(c => c >= 71 && c < 77), 'Lotuses retain ivory inner petals')
    assert(frame.colors.some(c => c >= 77 && c <= 82), 'Lotuses retain golden seed heads')
  }
}

// The final body joint is a projection boundary, not the centre of a circular tail.
const isolated = createPond(336, 120)
const fish = isolated.fish[1]
isolated.fish = [fish]
fish.x = 170; fish.y = 60; fish.angle = 0; fish.swimPhase = 0
const length = 25 * fish.scale * isolated.columns / 112
fish.spine = Array.from({ length: 22 }, (_, i) => ({ x: fish.x - length * i / 21, y: fish.y }))
const frame = renderPond(isolated), end = fish.spine.at(-1)
for (let y = Math.floor(end.y) - 5; y <= Math.ceil(end.y) + 5; y++) for (let x = Math.floor(end.x) - 10; x < Math.floor(end.x) - 2; x++) {
  const color = frame.colors[y * frame.columns + x]
  assert(color < 39 || color > 44, 'Tail material must not wrap behind its final joint')
}
assert(frame.coverage.some(c => c > 200), 'Tail check includes a rendered koi')

const ripplePond = createPond(280, 100, 1.6, { particleDensity: 0 })
ripplePond.fish = []
disturb(ripplePond, 140, 50)
ripplePond.ripples[0].age = 1
const ripple = renderPond(ripplePond), radius = 280 * .078
const nearColor = (cx, cy, color) => {
  for (let y = Math.round(cy) - 1; y <= Math.round(cy) + 1; y++) for (let x = Math.round(cx) - 1; x <= Math.round(cx) + 1; x++) if (ripple.colors[y * 280 + x] === color) return true
  return false
}
assert(nearColor(140 + radius, 50, 3), 'Ripple reaches its horizontal radius')
assert(nearColor(140, 50 + radius / ripplePond.aspect, 3), 'Ripple respects character aspect ratio')
assert(ripple.colors[50 * 280 + Math.round(140 + radius * .5)] >= 91, 'Ripple traces a ring without filling its interior')
configurePond(ripplePond, { rippleIntensity: 0 })
assert(!renderPond(ripplePond).colors.some(color => color === 3), 'Zero ripple intensity suppresses disturbance rings')
console.log('Rendering passed: portrait/desktop bounds, printable ASCII, plant and koi detail, purity, bounded tails and elliptical ripples.')
