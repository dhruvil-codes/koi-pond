import assert from 'node:assert/strict'
import { advance, createPond, feed, renderPond, ENVIRONMENTS } from '../src/core.js'
import { fishInitialize, fishLength } from '../src/fish.js'

for (const { id } of ENVIRONMENTS) for (const [columns, rows] of [[120, 64], [280, 98], [67, 74]]) {
  const pond = createPond(columns, rows, 1.6, { environment: id, particleDensity: 0 })
  pond.fish = []
  const x = columns * .805, y = rows * .16 // On the foreground lily pad.
  const before = renderPond(pond)
  feed(pond, x, y)
  const after = renderPond(pond)
  const cells = []
  for (let row = Math.floor(y - 4); row <= Math.ceil(y + 4); row++) for (let col = Math.floor(x - 5); col <= Math.ceil(x + 5); col++) {
    if (col < 0 || col >= columns || row < 0 || row >= rows) continue
    const index = row * columns + col
    if (after.colors[index] === 22 || after.colors[index] === 37) cells.push(index)
  }
  assert(cells.length >= 5, `${id} ${columns}x${rows}: food needs a visible multi-cell footprint`)
  assert(cells.every(i => after.coverage[i] >= 230 && after.colors[i] < after.palette.length), 'Food has opaque, valid warm/ivory ink above vegetation')
  assert(cells.some(i => after.colors[i] !== before.colors[i] || after.coverage[i] !== before.coverage[i]), 'Food must appear above the foreground')
  pond.food = []; pond.ripples = []
  const cleared = renderPond(pond)
  assert.deepEqual(cleared, before, 'Removing food and its tap ripple restores the underlying pond')
}

const cases = [
  { name: 'center', columns: 120, rows: 64, size: 1, speed: 1.35, count: 1, start: [60, 32, 0], food: [68, 32] },
  { name: 'behind', columns: 120, rows: 64, size: 1, speed: 1.35, count: 1, start: [60, 32, 0], food: [54, 32] },
  { name: 'near bank', columns: 120, rows: 64, size: 1.8, speed: 1.35, count: 1, start: [15, 12, Math.PI], food: [3, 12] },
  { name: 'portrait', columns: 67, rows: 74, size: .5, speed: 1.35, count: 1, start: [35, 35, Math.PI / 2], food: [35, 43] },
  { name: 'slow', columns: 120, rows: 64, size: .5, speed: .1, count: 1, start: [60, 32, 0], food: [61.7, 32] },
  { name: 'fast solo behind', columns: 120, rows: 64, size: 1.8, speed: 3, count: 1, start: [60, 32, 0], food: [52, 32] },
  { name: 'circle behind', columns: 120, rows: 64, size: 1, speed: 1.35, count: 1, start: [60, 32, 0], food: [54, 32], behavior: 'circle' },
  { name: 'fast school', columns: 120, rows: 64, size: 1.8, speed: 3, count: 30, start: [60, 32, Math.PI], food: [53, 32], behavior: 'school' },
]
for (const scenario of cases) {
  const pond = createPond(scenario.columns, scenario.rows, 1.6, { fishCount: scenario.count, fishSize: scenario.size, speed: scenario.speed, behavior: scenario.behavior || 'wander' })
  const fish = pond.fish[0]
  ;[fish.x, fish.y, fish.angle] = scenario.start
  fishInitialize(pond, fish)
  feed(pond, ...scenario.food)
  const firstDistance = Math.hypot(pond.food[0].x - fish.x, (pond.food[0].y - fish.y) * pond.aspect)
  assert(firstDistance > Math.max(.8, fishLength(pond, fish) * .075), 'Food begins outside biting range')
  let eatenAt = null
  for (let frame = 0; frame < 17 * 60; frame++) {
    advance(pond, 1 / 60)
    assert(Number.isFinite(fish.x + fish.y + fish.angle + fish.currentSpeed), `${scenario.name}: finite motion`)
    assert(fish.x >= 0 && fish.x < pond.columns && fish.y >= 0 && fish.y < pond.rows, `${scenario.name}: bounded motion`)
    const gap = fishLength(pond, fish) / (fish.spine.length - 1)
    for (let i = 1; i < fish.spine.length; i++) {
      const a = fish.spine[i - 1], b = fish.spine[i]
      assert(Math.abs(Math.hypot(b.x - a.x, (b.y - a.y) * pond.aspect) - gap) < 1e-8, `${scenario.name}: connected spine`)
    }
    if (pond.eaten) { eatenAt = pond.time; break }
  }
  assert(eatenAt !== null && eatenAt < 17, `${scenario.name}: fish should reach and eat the pellet before expiry`)
  assert.equal(pond.food.length, 0, `${scenario.name}: eaten food disappears`)
  assert(pond.ripples.some(ripple => ripple.kind === 'bite'), 'Eating creates a distinct short-lived bite event')
}

const equivalent = (columns, rows) => {
  const pond = createPond(columns, rows, 1.6, { fishCount: 1 })
  const fish = pond.fish[0]
  fish.x = columns * .5; fish.y = rows * .5; fish.angle = 0
  fishInitialize(pond, fish)
  feed(pond, columns * .59, rows * .5)
  return pond
}
const standard = equivalent(120, 64), double = equivalent(240, 128), thirtyHz = equivalent(120, 64)
for (let i = 0; i < 60; i++) { advance(standard, 1 / 60); advance(double, 1 / 60) }
for (let i = 0; i < 30; i++) advance(thirtyHz, 1 / 30)
assert.equal(standard.food.length, 1, 'Scaled motion is compared while the fish is still approaching')
assert(Math.abs(standard.fish[0].x / 120 - double.fish[0].x / 240) < 1e-9, 'Feeding preserves resolution-independent horizontal motion')
assert(Math.abs(standard.fish[0].y / 64 - double.fish[0].y / 128) < 1e-9, 'Feeding preserves resolution-independent vertical motion')
assert(Math.hypot(standard.fish[0].x - thirtyHz.fish[0].x, standard.fish[0].y - thirtyHz.fish[0].y) < 1e-9, 'Feeding preserves 30/60 Hz motion')
for (let i = 0; i < 16 * 60; i++) advance(standard, 1 / 60)
for (let i = 0; i < 16 * 30; i++) advance(thirtyHz, 1 / 30)
assert.equal(standard.eaten, 1, 'The reference feeding scenario reaches food')
assert.equal(thirtyHz.eaten, standard.eaten, '30/60 Hz feeding counts match')
assert.equal(thirtyHz.food.length, standard.food.length, '30/60 Hz food removal matches')
assert(Math.hypot(standard.fish[0].x - thirtyHz.fish[0].x, standard.fish[0].y - thirtyHz.fish[0].y) < .04, '30/60 Hz motion remains equivalent after eating')

const distant = createPond(120, 64, 1.6, { fishCount: 1, speed: .1 })
const loneFish = distant.fish[0]
loneFish.x = 60; loneFish.y = 32; loneFish.angle = 0
fishInitialize(distant, loneFish)
feed(distant, 105, 50)
for (let i = 0; i < 30; i++) advance(distant, 1 / 60)
assert.equal(distant.eaten, 0, 'A distant pellet cannot be eaten without a mouth approach')
assert.equal(distant.food.length, 1)
for (let i = 30; i < 18 * 60 + 1; i++) advance(distant, 1 / 60)
assert.equal(distant.food.length, 0, 'Expired pellets disappear')
assert.equal(distant.eaten, 0, 'Expiry is not counted as eating')

console.log('Feeding passed: visible pellets above vegetation in every scene, arrival and eating across speed/size/bank cases, connected bodies, and distinct expiry.')
