import { ENVIRONMENTS, paletteForEnvironment } from './environments.js'
import { paintEnvironmentBack, paintEnvironmentFront } from './environment.js'
import { DEFAULT_OPTIONS, validateOptions } from './config.js'
import { PALETTE } from './palette.js'
import { clamp } from './math.js'
import { fishCreate, fishInitialize, fishFollowSpine, fishAdvance, fishPaint } from './fish.js'

export { ENVIRONMENTS, PALETTE, DEFAULT_OPTIONS, validateOptions }

export function createPond(columns = 120, rows = 44, aspect = 1.6, options = {}) {
  const normalizedOptions = validateOptions(options)
  const pond = { columns, rows, aspect, time: 0, paused: normalizedOptions.paused, options: normalizedOptions, eaten: 0, ripples: [], food: [], fish: [] }
  while (pond.fish.length < normalizedOptions.fishCount) {
    const fish = fishCreate(pond, pond.fish.length)
    fishInitialize(pond, fish)
    pond.fish.push(fish)
  }
  return pond
}

export function configurePond(pond, partial) {
  const options = validateOptions(partial, pond.options), previous = pond.options
  pond.options = options
  pond.paused = options.paused
  if (options.seed !== previous.seed) pond.fish = []
  while (pond.fish.length > options.fishCount) pond.fish.pop()
  while (pond.fish.length < options.fishCount) {
    const fish = fishCreate(pond, pond.fish.length)
    fishInitialize(pond, fish)
    pond.fish.push(fish)
  }
  if (options.fishSize !== previous.fishSize) for (const fish of pond.fish) fishFollowSpine(pond, fish)
  if (options.varieties.some((id, index) => id !== previous.varieties[index]) || options.varieties.length !== previous.varieties.length) {
    pond.fish.forEach((fish, index) => { fish.variety = options.varieties[index % options.varieties.length] })
  }
  return { ...options, varieties: [...options.varieties] }
}

export function resizePond(pond, columns, rows) {
  const sx = columns / pond.columns, sy = rows / pond.rows
  for (const p of [...pond.fish, ...pond.ripples, ...pond.food]) { p.x *= sx; p.y *= sy }
  for (const fish of pond.fish) {
    fish.currentSpeed *= sx
    for (const node of fish.spine) { node.x *= sx; node.y *= sy }
  }
  pond.columns = columns; pond.rows = rows
  for (const fish of pond.fish) fishFollowSpine(pond, fish)
}

export function disturb(pond, x, y, strength = 1) {
  pond.ripples.push({ x: clamp(x, 0, pond.columns - 1), y: clamp(y, 0, pond.rows - 1), age: 0, strength })
  if (pond.ripples.length > 10) pond.ripples.shift()
}

export function feed(pond, x, y) {
  const margin = Math.min(3, pond.columns / 5, pond.rows / 5)
  pond.food.push({ x: clamp(x, margin, pond.columns - margin), y: clamp(y, margin, pond.rows - margin), age: 0 })
  if (pond.food.length > 8) pond.food.shift()
  disturb(pond, x, y, 1)
}

export function advance(pond, delta) {
  if (pond.paused || pond.options.paused) return
  // Small substeps keep steering and connected bodies consistent at any refresh rate.
  const duration = clamp(delta, 0, .15), count = Math.max(1, Math.ceil(duration * 120))
  for (let i = 0; i < count; i++) {
    const dt = duration / count
    pond.time += dt
    for (const ripple of pond.ripples) ripple.age += dt
    for (const pellet of pond.food) pellet.age += dt
    pond.ripples = pond.ripples.filter(ripple => ripple.age < 5)
    pond.food = pond.food.filter(pellet => pellet.age < 18)
    fishAdvance(pond, dt, disturb)
  }
}

export function renderPond(pond) {
  const { columns, rows } = pond
  const frame = { columns, rows, chars: new Uint8Array(columns * rows).fill(32), colors: new Uint8Array(columns * rows), coverage: new Uint8Array(columns * rows), palette: paletteForEnvironment(pond.options.environment, PALETTE, pond.options) }
  const put = (x, y, glyph, color, surface = 0) => {
    x = Math.round(x); y = Math.round(y)
    if (x >= 0 && x < columns && y >= 0 && y < rows) {
      const index = y * columns + x
      frame.chars[index] = glyph.charCodeAt(0); frame.colors[index] = color; frame.coverage[index] = surface
    }
  }
  paintEnvironmentBack(pond, frame, put)
  fishPaint(pond, frame, put)
  for (const pellet of pond.food) put(pellet.x, pellet.y, pond.time % .8 < .4 ? '.' : '*', 38)
  paintEnvironmentFront(pond, frame, put)
  return frame
}
