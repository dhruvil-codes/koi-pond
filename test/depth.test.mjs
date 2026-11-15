import assert from 'node:assert/strict'
import { advance, createPond, feed, renderPond } from '../src/core.js'
import { fishInitialize, fishPaint } from '../src/fish.js'

const first = createPond(120, 64, 1.6, { fishCount: 7 })
const repeat = createPond(120, 64, 1.6, { fishCount: 7 })
assert(first.fish.every(fish => fish.depth >= 0 && fish.depth <= 1))
assert(new Set(first.fish.map(fish => fish.depth.toFixed(3))).size >= 4, 'Individuals occupy varied depths')
assert.deepEqual(first.fish.map(fish => fish.depth), repeat.fish.map(fish => fish.depth))
let maxStep = 0
for (let i = 0; i < 600; i++) {
  const previous = first.fish.map(fish => fish.depth)
  advance(first, 1 / 60); advance(repeat, 1 / 60)
  first.fish.forEach((fish, index) => {
    assert(fish.depth >= 0 && fish.depth <= 1, 'Depth stays bounded')
    maxStep = Math.max(maxStep, Math.abs(fish.depth - previous[index]))
    assert(fish.tailEffort >= .2 && fish.tailEffort <= 1, 'Tail effort stays bounded while fish alternate gliding and coasting')
  })
}
assert(maxStep < .02, 'Depth changes gradually between frames')
assert.deepEqual(first.fish, repeat.fish, 'Depth and tail effort stay reproducible')

const sixty = createPond(120, 64, 1.6, { fishCount: 1 })
const thirty = createPond(120, 64, 1.6, { fishCount: 1 })
for (let i = 0; i < 360; i++) advance(sixty, 1 / 60)
for (let i = 0; i < 180; i++) advance(thirty, 1 / 30)
assert(Math.abs(sixty.fish[0].depth - thirty.fish[0].depth) < .002, 'Depth agrees at 30 and 60 Hz')

const approaching = createPond(120, 64, 1.6, { fishCount: 1, speed: .1 })
const cruising = createPond(120, 64, 1.6, { fishCount: 1, speed: .1 })
for (const pond of [approaching, cruising]) {
  const fish = pond.fish[0]
  fish.x = 60; fish.y = 32; fish.angle = 0
  fishInitialize(pond, fish)
}
feed(approaching, 67, 32)
for (let i = 0; i < 120; i++) { advance(approaching, 1 / 60); advance(cruising, 1 / 60) }
assert(approaching.fish[0].depth < cruising.fish[0].depth - .1, 'Fish rise smoothly toward nearby food')
assert.equal(approaching.food.length, 1, 'Depth does not consume food outside mouth range')

const snapshot = structuredClone(first.fish)
renderPond(first)
assert.deepEqual(first.fish, snapshot, 'Full render leaves fish simulation state unchanged')

function paintAt(depth, clarity) {
  const pond = createPond(240, 90, 1.6, { fishCount: 1, waterClarity: clarity })
  const fish = pond.fish[0]
  fish.x = 120; fish.y = 45; fish.angle = 0
  fishInitialize(pond, fish)
  fish.depth = depth
  const before = structuredClone(pond.fish)
  const frame = { columns: pond.columns, rows: pond.rows }
  const shadow = [], body = []
  fishPaint(pond, frame, (x, y, glyph, color, coverage) => {
    assert(x >= 0 && x < frame.columns && y >= 0 && y < frame.rows, 'Paint stays inside the grid')
    assert(coverage >= 0 && coverage <= 255)
    if (color === 0 && glyph === ' ') shadow.push([x, y, coverage])
    if (color >= 15 && color <= 44 || color >= 83 && color <= 90) body.push(color)
  })
  assert.deepEqual(pond.fish, before, 'Fish painting does not alter fish state')
  assert(shadow.length > 0 && body.length > 0, 'Shadow and body both render')
  return { shadow, body }
}
const shallow = paintAt(.1, .8), deep = paintAt(.9, .8), murky = paintAt(.9, 0)
const mean = (points, index) => points.reduce((sum, point) => sum + point[index], 0) / points.length
assert(mean(deep.shadow, 0) > mean(shallow.shadow, 0) + 1, 'Deeper shadow is visibly displaced')
assert(mean(deep.shadow, 2) > mean(murky.shadow, 2), 'Clarity affects projected shadow shading')
assert(deep.body.some(color => color >= 23 && color <= 30), 'Kohaku red body patches remain visible')

console.log('Depth passed: bounded and deterministic motion, smooth feeding rise, immutable painting, and displaced water-palette shadows.')
