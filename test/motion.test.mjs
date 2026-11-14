import assert from 'node:assert/strict'
import { configurePond, createPond, advance, feed, resizePond, renderPond } from '../src/core.js'

const fast = createPond(120, 64, 1.6, { fishCount: 30, fishSize: 1.8 }), slow = createPond(120, 64, 1.6, { fishCount: 30, fishSize: 1.8 })
for (let i = 0; i < 600; i++) advance(fast, 1 / 60)
for (let i = 0; i < 300; i++) advance(slow, 1 / 30)
const refreshError = fast.fish.map((f, i) => Math.hypot(f.x - slow.fish[i].x, (f.y - slow.fish[i].y) * fast.aspect))
assert(Math.max(...refreshError) < .04, 'Swimming must not change noticeably between 30Hz and 60Hz')

const slowSpeed = createPond(120, 64, 1.6, { speed: .1 }), fastSpeed = createPond(120, 64, 1.6, { speed: 3 })
for (let i = 0; i < 240; i++) { advance(slowSpeed, 1 / 60); advance(fastSpeed, 1 / 60) }
assert(fastSpeed.fish[0].currentSpeed > slowSpeed.fish[0].currentSpeed * 4, 'Speed option steers swim velocity over time')
configurePond(slowSpeed, { paused: true })
const pausedState = JSON.stringify(slowSpeed)
advance(slowSpeed, .1)
assert.equal(JSON.stringify(slowSpeed), pausedState, 'Option pause stops simulation state')
configurePond(slowSpeed, { paused: false })
assert.equal(slowSpeed.paused, false)

const pond = createPond(120, 64, 1.6)
let maximumAcceleration = 0
for (let frame = 0; frame < 3600; frame++) {
  if (frame % 360 === 0) feed(pond, frame % 720 ? 105 : 15, frame % 720 ? 10 : 54)
  const previous = pond.fish.map(f => f.turnVelocity)
  advance(pond, 1 / 60)
  for (let i = 0; i < pond.fish.length; i++) {
    const f = pond.fish[i], spacing = 25 * f.scale * pond.options.fishSize * pond.columns / 112 / (f.spine.length - 1)
    maximumAcceleration = Math.max(maximumAcceleration, Math.abs(f.turnVelocity - previous[i]) * 60)
    assert(Number.isFinite(f.x + f.y + f.angle))
    assert(f.x >= 0 && f.x < pond.columns && f.y >= 0 && f.y < pond.rows)
    assert.equal(f.spine[0].x, f.x); assert.equal(f.spine[0].y, f.y)
    for (let j = 1; j < f.spine.length; j++) {
      const p = f.spine[j - 1], q = f.spine[j]
      assert(Math.abs(Math.hypot(q.x - p.x, (q.y - p.y) * pond.aspect) - spacing) < 1e-8, 'Spine joints must remain connected')
    }
  }
}
assert(maximumAcceleration < 5.6, 'Direction changes must ease in rather than snap')
resizePond(pond, 67, 74)
for (let i = 0; i < 120; i++) advance(pond, 1 / 60)
const frame = renderPond(pond)
assert.equal(frame.chars.length, 67 * 74)
assert(frame.chars.every(c => c >= 32 && c <= 126))
console.log(JSON.stringify({ refreshRateMaximumDriftCells: Math.max(...refreshError), maximumTurnAcceleration: maximumAcceleration, verifiedSeconds: 60, spineJointsConnected: true, portraitResize: 'passed' }))
