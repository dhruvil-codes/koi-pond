/*! Koi Pond v0.1.0 | Copyright 2026 Dhruvil | MIT License */
const ENVIRONMENTS = Object.freeze([
  { id: 'midnight', label: 'Midnight', description: 'Black still water' },
  { id: 'rain', label: 'Rain', description: 'Cool teal water with gentle rainfall rings' },
  { id: 'dusk', label: 'Dusk', description: 'Warm dark water with drifting petals' },
].map(environment => Object.freeze(environment)))

const WATER = {
  midnight: null,
  rain: ['#031011', '#07191a', '#0b2222', '#12302d', '#29413b', '#52675b', '#eee8d8', '#99592a', '#c98135', '#dfaa60', '#62685b', '#787a6c', '#b7b29f', '#b45d42', '#3b3e37'],
  dusk: ['#100908', '#1b100d', '#291713', '#382019', '#56382b', '#80604a', '#eee8d8', '#99592a', '#c98135', '#dfaa60', '#62685b', '#787a6c', '#b7b29f', '#b45d42', '#3b3e37'],
}

function paletteForEnvironment(id, basePalette) {
  if (id === 'midnight') return basePalette.slice()
  const water = WATER[id]
  if (!water) throw new RangeError(`Unknown environment: ${id}`)
  return [...water, ...basePalette.slice(water.length)]
}


const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a))
const hash = (x, y) => ((Math.imul(x + 31, 374761393) ^ Math.imul(y + 19, 668265263)) >>> 0) / 4294967296
const ramp = (a, b, count) => Array.from({ length: count }, (_, i) => '#' + [0, 1, 2].map(c => {
  const p = parseInt(a.slice(c * 2, c * 2 + 2), 16), q = parseInt(b.slice(c * 2, c * 2 + 2), 16)
  return Math.round(p + (q - p) * i / (count - 1)).toString(16).padStart(2, '0')
}).join(''))

const PALETTE = ['#000000', '#0b0d0c', '#161b17', '#242923', '#55574e', '#8d8c7d', '#eee8d8', '#99592a', '#c98135', '#dfaa60', '#62685b', '#787a6c', '#b7b29f', '#b45d42', '#3b3e37',
  ...ramp('c0bfaa', 'fffbed', 8), ...ramp('b34334', 'f76d54', 8), ...ramp('a15d1e', 'f0af4c', 8), ...ramp('42453c', '88897a', 6),
  ...ramp('163528', '7c905b', 12), '#9aaea0', '#dce6cf',
  ...ramp('713b52', 'f3c1cd', 12), ...ramp('dca7b1', 'fff0df', 6), ...ramp('8e5d28', 'f2cc73', 6)]
const DENSITY = ':;t%SX8#@'
const JOINTS = 22
const DEFAULT_OPTIONS = Object.freeze({ environment: 'midnight', speed: 1.35, fishCount: 7, lilies: true, lotus: true, detail: 'fine', paused: false, interactive: true })
const OPTION_KEYS = new Set(Object.keys(DEFAULT_OPTIONS))


function validateOptions(partial = {}, current = DEFAULT_OPTIONS) {
  if (!partial || typeof partial !== 'object' || Array.isArray(partial)) throw new TypeError('Options must be an object')
  if (!current || typeof current !== 'object' || Array.isArray(current)) throw new TypeError('Current options must be an object')
  for (const key of Object.keys(partial)) if (!OPTION_KEYS.has(key)) throw new TypeError(`Unknown option: ${key}`)
  const next = { ...DEFAULT_OPTIONS, ...current, ...partial }
  if (!ENVIRONMENTS.some(environment => environment.id === next.environment)) throw new RangeError('environment must be midnight, rain, or dusk')
  if (typeof next.speed !== 'number' || !Number.isFinite(next.speed) || next.speed < .25 || next.speed > 2.5) throw new RangeError('speed must be a finite number from 0.25 to 2.5')
  if (!Number.isInteger(next.fishCount) || next.fishCount < 1 || next.fishCount > 16) throw new RangeError('fishCount must be an integer from 1 to 16')
  for (const key of ['lilies', 'lotus', 'paused', 'interactive']) if (typeof next[key] !== 'boolean') throw new TypeError(`${key} must be a boolean`)
  if (next.detail !== 'fine' && next.detail !== 'balanced') throw new TypeError('detail must be fine or balanced')
  return next
}
const DEWDROPS = [[-.31, -.24, .068], [.23, .39, .045]]
// Normalized layouts keep the two loose clusters at the pond's edge on resize.
const LILIES = [
  [.81, .17, .049, -2.3, .84], [.895, .255, .035, 2.5, .92],
  [.79, .345, .031, -.9, .88], [.93, .115, .022, .8, .8],
  [.795, .74, .037, -2.7, .89], [.88, .805, .027, -1.2, .83],
  [.735, .83, .023, .65, .91],
]

const FISH_LAYOUT = [
  { x: .47, y: .24, angle: -.08, speed: 2.35, scale: .62, phase: .5, kind: 0, curve: .105 },
  { x: .33, y: .43, angle: 3.04, speed: 2.8, scale: .92, phase: 2.5, kind: 1, curve: .017 },
  { x: .29, y: .55, angle: -1.92, speed: 2.65, scale: .72, phase: 4.2, kind: 2, curve: -.065 },
  { x: .11, y: .76, angle: 2.25, speed: 2.6, scale: .6, phase: 5.8, kind: 3, curve: -.035 },
  { x: .59, y: .49, angle: -.32, speed: 3.4, scale: .3, phase: 1.2, kind: 2, curve: .026 },
  { x: .68, y: .59, angle: -.52, speed: 3.6, scale: .25, phase: 1.7, kind: 3, curve: .07 },
  { x: .54, y: .74, angle: -.18, speed: 3.3, scale: .32, phase: 3.8, kind: 0, curve: -.03 },
]

function createPond(columns = 120, rows = 44, aspect = 1.6, options = {}) {
  const normalizedOptions = validateOptions(options)
  const pond = { columns, rows, aspect, time: 0, paused: normalizedOptions.paused, options: normalizedOptions, eaten: 0, ripples: [], food: [], fish: [] }
  while (pond.fish.length < normalizedOptions.fishCount) {
    const f = makeFish(pond, pond.fish.length)
    initializeFish(pond, f)
    pond.fish.push(f)
  }
  return pond
}

function makeFish(pond, index) {
  if (index < FISH_LAYOUT.length) {
    const seed = FISH_LAYOUT[index]
    return { ...seed, x: seed.x * pond.columns, y: seed.y * pond.rows }
  }
  const n = index - 4
  return {
    x: pond.columns * (.18 + (n * .173) % .64), y: pond.rows * (.18 + (n * .287) % .64),
    angle: -0.2 + n * 1.71, speed: 3.25 + n % 3 * .17, scale: [.3, .25, .32][n % 3],
    phase: 1.1 + n * 1.39, kind: n % 4, curve: [-.03, .026, .07][n % 3],
  }
}

function initializeFish(pond, fish) {
  fish.turnVelocity = 0
  fish.currentSpeed = fish.speed * pond.columns / 100 * pond.options.speed
  fish.swimPhase = fish.phase
  fish.spine = [{ x: fish.x, y: fish.y }]
  const gap = fishLength(pond, fish) / (JOINTS - 1)
  for (let j = 1; j < JOINTS; j++) {
    const previous = fish.spine[j - 1], a = fish.angle + Math.PI + fish.curve * j
    fish.spine.push({ x: previous.x + Math.cos(a) * gap, y: previous.y + Math.sin(a) * gap / pond.aspect })
  }
}

function configurePond(pond, partial) {
  const options = validateOptions(partial, pond.options)
  pond.options = options
  pond.paused = options.paused
  while (pond.fish.length > options.fishCount) pond.fish.pop()
  while (pond.fish.length < options.fishCount) {
    const fish = makeFish(pond, pond.fish.length)
    initializeFish(pond, fish)
    pond.fish.push(fish)
  }
  return options
}

const fishLength = (pond, fish) => 25 * fish.scale * pond.columns / 112

function resizePond(pond, columns, rows) {
  const sx = columns / pond.columns, sy = rows / pond.rows
  for (const p of [...pond.fish, ...pond.ripples, ...pond.food]) { p.x *= sx; p.y *= sy }
  for (const f of pond.fish) {
    f.currentSpeed *= sx
    for (const node of f.spine) { node.x *= sx; node.y *= sy }
  }
  pond.columns = columns; pond.rows = rows
  for (const f of pond.fish) followSpine(pond, f)
}

function disturb(pond, x, y, strength = 1) {
  pond.ripples.push({ x: clamp(x, 0, pond.columns - 1), y: clamp(y, 0, pond.rows - 1), age: 0, strength })
  if (pond.ripples.length > 10) pond.ripples.shift()
}

function feed(pond, x, y) {
  const margin = Math.min(3, pond.columns / 5, pond.rows / 5)
  pond.food.push({ x: clamp(x, margin, pond.columns - margin), y: clamp(y, margin, pond.rows - margin), age: 0 })
  if (pond.food.length > 8) pond.food.shift()
  disturb(pond, x, y, 1)
}

function followSpine(pond, fish) {
  const gap = fishLength(pond, fish) / (JOINTS - 1)
  fish.spine[0].x = fish.x; fish.spine[0].y = fish.y
  let backward = fish.angle + Math.PI
  for (let i = 1; i < JOINTS; i++) {
    const previous = fish.spine[i - 1], node = fish.spine[i]
    const oldAngle = Math.atan2((node.y - previous.y) * pond.aspect, node.x - previous.x)
    const angle = backward + clamp(wrap(oldAngle - backward), -.29, .29)
    node.x = previous.x + Math.cos(angle) * gap
    node.y = previous.y + Math.sin(angle) * gap / pond.aspect
    backward = angle
  }
}

function step(pond, dt) {
  pond.time += dt
  for (const r of pond.ripples) r.age += dt
  for (const p of pond.food) p.age += dt
  pond.ripples = pond.ripples.filter(r => r.age < 5)
  pond.food = pond.food.filter(p => p.age < 18)
  for (const fish of pond.fish) {
    let target = { x: pond.columns * (.5 + .32 * Math.cos(pond.time * .055 + fish.phase)), y: pond.rows * (.5 + .3 * Math.sin(pond.time * .045 + fish.phase)) }
    let nearest = Infinity, pellet
    for (const p of pond.food) {
      const d = Math.hypot(p.x - fish.x, (p.y - fish.y) * pond.aspect)
      if (d < nearest) { nearest = d; target = p; pellet = p }
    }
    if (pellet && nearest < Math.max(.8, fishLength(pond, fish) * .075)) {
      pond.food.splice(pond.food.indexOf(pellet), 1); pond.eaten++
      disturb(pond, pellet.x, pellet.y, .3); pellet = undefined
    }
    let hx = target.x - fish.x, hy = (target.y - fish.y) * pond.aspect
    const toward = Math.hypot(hx, hy) || 1
    hx /= toward; hy /= toward
    if (!pellet) {
      const ax = (fish.x - pond.columns / 2) / (pond.columns * .2), ay = (fish.y - pond.rows / 2) / (pond.rows * .18)
      const distance = Math.hypot(ax, ay) || .001
      if (distance < 1.3) { const push = (1.3 - distance) * 1.5; hx += ax / distance * push; hy += ay / distance * push }
    }
    for (const other of pond.fish) if (other !== fish) {
      const dx = fish.x - other.x, dy = (fish.y - other.y) * pond.aspect, d = Math.hypot(dx, dy)
      const safe = (fishLength(pond, fish) + fishLength(pond, other)) * .25
      if (d > .01 && d < safe) { const push = (1 - d / safe) * (pellet ? .35 : 1.1); hx += dx / d * push; hy += dy / d * push }
    }
    const edge = fishLength(pond, fish) * .7
    if (fish.x < edge) hx += (edge - fish.x) / edge * 2.5
    if (fish.x > pond.columns - edge) hx -= (fish.x - pond.columns + edge) / edge * 2.5
    const edgeY = edge / pond.aspect
    if (fish.y < edgeY) hy += (edgeY - fish.y) / edgeY * 2.5
    if (fish.y > pond.rows - edgeY) hy -= (fish.y - pond.rows + edgeY) / edgeY * 2.5
    const error = wrap(Math.atan2(hy, hx) - fish.angle)
    const desiredTurn = clamp(error * 1.5, -.8, .8)
    fish.turnVelocity += (desiredTurn - fish.turnVelocity) * (1 - Math.exp(-dt * 3.5))
    fish.angle = wrap(fish.angle + fish.turnVelocity * dt)
    const speedTarget = fish.speed * pond.columns / 100 * pond.options.speed * (pellet ? 1.55 : .88 + .08 * Math.sin(pond.time * .6 + fish.phase))
    fish.currentSpeed += (speedTarget - fish.currentSpeed) * (1 - Math.exp(-dt * 1.8))
    fish.x = clamp(fish.x + Math.cos(fish.angle) * fish.currentSpeed * dt, .5, pond.columns - .5)
    fish.y = clamp(fish.y + Math.sin(fish.angle) * fish.currentSpeed * dt / pond.aspect, .5, pond.rows - .5)
    fish.swimPhase += dt * (1.5 + fish.currentSpeed / pond.columns * 38)
    followSpine(pond, fish)
  }
}

function advance(pond, delta) {
  if (pond.paused || pond.options?.paused) return
  // Small fixed substeps keep steering and body following consistent at any refresh rate.
  const duration = clamp(delta, 0, .15), count = Math.max(1, Math.ceil(duration * 90))
  for (let i = 0; i < count; i++) step(pond, duration / count)
}

function animatedSpine(pond, fish) {
  const length = fishLength(pond, fish)
  return fish.spine.map((p, i, nodes) => {
    const t = i / (JOINTS - 1), previous = nodes[Math.max(0, i - 1)], next = nodes[Math.min(JOINTS - 1, i + 1)]
    const dx = previous.x - next.x, dy = (previous.y - next.y) * pond.aspect, d = Math.hypot(dx, dy) || 1
    const wave = Math.sin(fish.swimPhase - t * 4.6) * length * .024 * t ** 1.8
    return { x: p.x - dy / d * wave, y: p.y + dx / d * wave / pond.aspect }
  })
}

function lilyPads(pond) {
  return LILIES.map(([x, y, radius, rotation, flatten], index) => {
    const phase = index * 2.39
    let sway = Math.sin(pond.time * .24 + phase) * .018
    for (const ripple of pond.ripples) {
      const distance = Math.hypot(x * pond.columns - ripple.x, (y * pond.rows - ripple.y) * pond.aspect)
      const arrival = distance / (pond.columns * .078), age = ripple.age - arrival
      if (age > 0) sway += Math.sin(age * 7) * Math.exp(-age * 2.4) * ripple.strength * .065
    }
    const angle = rotation + sway
    return {
      x: (x + Math.sin(pond.time * .16 + phase) * .0012) * pond.columns,
      y: y * pond.rows + Math.cos(pond.time * .19 + phase) * pond.columns * .0007 / pond.aspect,
      radius: radius * pond.columns, cos: Math.cos(angle), sin: Math.sin(angle), flatten, phase,
    }
  })
}

function drawLilyPads(pond, pads, put, shadows = false) {
  const { columns, rows, aspect } = pond
  for (const pad of pads) {
    const r = pad.radius, cx = pad.x + (shadows ? r * .06 : 0), cy = pad.y + (shadows ? r * .11 / aspect : 0)
    for (let y = Math.max(0, Math.floor(cy - r / aspect - 1)); y <= Math.min(rows - 1, Math.ceil(cy + r / aspect + 1)); y++) {
      for (let x = Math.max(0, Math.floor(cx - r - 1)); x <= Math.min(columns - 1, Math.ceil(cx + r + 1)); x++) {
        const dx = (x - cx) / r, dy = (y - cy) * aspect / r
        const u = dx * pad.cos + dy * pad.sin, v = (-dx * pad.sin + dy * pad.cos) / pad.flatten
        const radius = Math.hypot(u, v), angle = Math.atan2(v, u)
        const edge = 1 + .022 * Math.sin(angle * 5 + pad.phase) + .012 * Math.sin(angle * 11 - pad.phase)
        // The open V reaches the leaf's centre, with a slightly rolled inner lip.
        const notch = u > -.09 && Math.abs(v) < (u + .09) * .27
        if (radius > edge || notch) continue
        if (shadows) { put(x, y, '.', 2, 150); continue }
        const rim = radius > edge - .07
        const veinAngle = Math.atan2(v, u + .13), veinRadius = Math.hypot(u + .13, v)
        const vein = radius > .14 ? clamp(1 - Math.abs(Math.sin(veinAngle * 7)) * veinRadius / .075, 0, 1) : 0
        const mainVein = vein > .32
        const branchVein = radius > .4 && Math.abs(Math.sin(veinAngle * 14 + radius * 13)) < .1
        const growth = Math.sin((radius + .016 * Math.sin(angle * 9)) * 48 + pad.phase)
        const innerLip = u > -.09 && Math.abs(Math.abs(v) - (u + .09) * .27) < .045
        let light = .46 - dx * .19 - dy * .23 + .05 * growth + .025 * Math.sin(u * 31 + v * 21 + pad.phase)
        light += vein * .32
        if (branchVein) light += .06
        if (rim) light += dx + dy < -.35 ? .15 : -.23
        if (innerLip) light += .13
        const glyph = rim ? (Math.abs(v) > Math.abs(u) ? '_' : Math.sign(u * v) > 0 ? '/' : '\\')
          : mainVein ? (Math.abs(v) < .25 ? '-' : Math.sign(u * v) > 0 ? '/' : '\\')
          : branchVein ? ':' : growth > .55 ? ';' : '.'
        put(x, y, glyph, 45 + Math.floor(clamp(light, 0, 1) * 11), 246)
        if (r > 6) {
          for (const [du, dv, size] of DEWDROPS) {
            const distance = Math.hypot(u - du, v - dv)
            if (distance < size) put(x, y, distance < size * .35 ? '.' : 'o', distance < size * .35 ? 58 : 57, 215)
          }
        }
      }
    }
  }
}

function drawLotus(pond, put) {
  const { columns, rows, aspect, time } = pond
  const r = columns * .038, cx = columns * (.832 + Math.sin(time * .16) * .001), cy = rows * .268 + Math.cos(time * .18) * r * .025 / aspect
  const left = Math.max(0, Math.floor(cx - r - 1)), right = Math.min(columns - 1, Math.ceil(cx + r + 1))
  const top = Math.max(0, Math.floor(cy - r / aspect - 1)), bottom = Math.min(rows - 1, Math.ceil(cy + r / aspect + 1))
  // Successive whorls overlap in painter's order: sepals, pink petals, ivory inner petals.
  const layers = [
    { count: 6, length: .92, width: .18, offset: .5, family: 45, shades: 12 },
    { count: 9, length: 1, width: .26, offset: .1, family: 59, shades: 12 },
    { count: 8, length: .76, width: .27, offset: .48, family: 59, shades: 12 },
    { count: 7, length: .5, width: .22, offset: .18, family: 71, shades: 6 },
  ]
  for (const layer of layers) for (let petal = 0; petal < layer.count; petal++) {
    const angle = petal / layer.count * Math.PI * 2 + layer.offset + Math.sin(time * .13) * .018
    const cos = Math.cos(angle), sin = Math.sin(angle)
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const dx = (x - cx) / r, dy = (y - cy) * aspect / r
      const u = dx * cos + dy * sin, v = -dx * sin + dy * cos, q = (u + .09) / (layer.length + .09)
      if (q <= 0 || q >= 1 || Math.abs(v) > layer.width) continue
      const width = layer.width * Math.sin(q * Math.PI) ** .8, cross = Math.abs(v) / width
      if (cross > 1) continue
      const rim = cross > .8, fold = Math.abs(v) < width * .12
      const vein = Math.abs(Math.sin(v / layer.width * 17 + q)) < .18
      let light = .26 + .33 * q + .3 * Math.sqrt(1 - cross * cross) - dx * .08 - dy * .12
      if (rim) light -= .12
      if (fold) light += .12
      if (vein) light -= .065
      const glyph = rim ? (sin * cos > 0 ? '/' : '\\') : fold ? '|' : vein ? ':' : ';'
      put(x, y, glyph, layer.family + Math.floor(clamp(light, 0, 1) * (layer.shades - 1)), 250)
    }
  }
  for (let y = Math.floor(cy - r * .23 / aspect); y <= Math.ceil(cy + r * .23 / aspect); y++) {
    for (let x = Math.floor(cx - r * .23); x <= Math.ceil(cx + r * .23); x++) {
      const dx = (x - cx) / r, dy = (y - cy) * aspect / r, d = Math.hypot(dx, dy)
      if (d < .17) {
        const seed = hash(x, y) > .52
        put(x, y, seed ? 'o' : '*', 77 + Math.floor(clamp(.78 - dx - dy - (seed ? .24 : 0), 0, 1) * 5), 252)
      } else if (d < .23 && Math.abs(Math.sin(Math.atan2(dy, dx) * 9)) > .8) put(x, y, '.', 81, 220)
    }
  }
}

function drawFishWake(pond, fish, put) {
  const length = fishLength(pond, fish)
  for (let i = 0; i < 19; i++) {
    if (i % 3 === 1) continue
    const t = .45 + i * .05, joint = Math.min(JOINTS - 1, Math.round(t * (JOINTS - 1)))
    const node = fish.spine[joint], previous = fish.spine[Math.max(0, joint - 1)]
    const dx = node.x - previous.x, dy = (node.y - previous.y) * pond.aspect, distance = Math.hypot(dx, dy) || 1
    const extension = Math.max(0, t - 1) * length, spread = length * (.07 + (t - .45) * .13)
    const x = node.x + dx / distance * extension, y = node.y + dy / distance * extension / pond.aspect
    for (const side of [-1, 1]) put(x - dy / distance * spread * side, y + dx / distance * spread * side / pond.aspect, '.', t < .75 ? 2 : 1)
  }
}

function renderPond(pond) {
  const { columns: cols, rows, time, aspect } = pond
  const chars = new Uint8Array(cols * rows).fill(32), colors = new Uint8Array(cols * rows), coverage = new Uint8Array(cols * rows)
  const put = (x, y, glyph, color, surface = 0) => {
    x = Math.round(x); y = Math.round(y)
    if (x >= 0 && x < cols && y >= 0 && y < rows) { const i = y * cols + x; chars[i] = glyph.charCodeAt(0); colors[i] = color; coverage[i] = surface }
  }
  // Reuse each column's wave phase across rows instead of evaluating trig per cell.
  const water = Array.from({ length: cols }, (_, x) => {
    const bend = x * .09 + Math.sin(x * .05 + time * .08)
    return [Math.sin(bend), Math.cos(bend), Math.sin(x * .025), Math.cos(x * .025)]
  })
  for (let y = 0; y < rows; y++) {
    const sy = Math.sin(y * .36), cy = Math.cos(y * .36), sy2 = Math.sin(-y * .21 - time * .04), cy2 = Math.cos(-y * .21 - time * .04)
    for (let x = 0; x < cols; x++) {
      const w = water[x], wave = w[0] * cy + w[1] * sy + w[3] * cy2 - w[2] * sy2
      if (Math.abs(wave) < .036 && hash(x, y) > .66) put(x, y, '.', 1)
    }
  }
  // Trace only the rings' perimeters; work scales with circumference, not pond area.
  const ring = (r, radius, color) => {
    const segments = Math.max(12, Math.ceil(radius * Math.PI * 2 / .8))
    for (let i = 0; i < segments; i++) {
      const angle = i / segments * Math.PI * 2
      put(r.x + Math.cos(angle) * radius, r.y + Math.sin(angle) * radius / aspect, radius > 1 ? '.' : '*', color)
    }
  }
  if (pond.options.environment === 'rain') {
    const count = Math.min(72, Math.max(14, Math.round(cols * rows / 800)))
    for (let i = 0; i < count; i++) {
      const lifetime = time * .7 + hash(i, 81) * 2.8, cycle = Math.floor(lifetime / 2.8), age = lifetime - cycle * 2.8
      const center = { x: hash(i + cycle * 59, 19) * cols, y: hash(i + cycle * 41, 137) * rows }
      ring(center, .35 + age * 2.7, age < .3 ? 4 : age < 1.6 ? 3 : 2)
      if (age > 1.35) ring(center, .35 + (age - 1.35) * 2.7, 2)
    }
  }
  for (const r of pond.ripples) {
    const radius = r.age * cols * .078, color = r.age < .8 && r.strength > .8 ? 10 : r.age < 2 ? 3 : r.age < 3.5 ? 2 : 1
    if (r.age > .04) ring(r, radius, color)
    if (r.age > .3) ring(r, radius * .72, r.age < 2 ? 2 : 1)
  }
  const pads = pond.options.lilies ? lilyPads(pond) : []
  if (pond.options.lilies) drawLilyPads(pond, pads, put, true)
  for (const fish of pond.fish) drawFishWake(pond, fish, put)
  for (const fish of pond.fish) {
    const spine = animatedSpine(pond, fish), s = fish.scale * cols / 112
    const segments = spine.slice(0, -1).map((a, j) => {
      const b = spine[j + 1], dx = b.x - a.x, dy = (b.y - a.y) * aspect
      return { x: a.x, y: a.y, dx, dy, inverseSquared: 1 / (dx * dx + dy * dy || 1), angle: Math.atan2(-dy, -dx) }
    })
    const xs = spine.map(p => p.x), ys = spine.map(p => p.y), margin = 6 * s
    const left = Math.max(0, Math.floor(Math.min(...xs) - margin)), right = Math.min(cols - 1, Math.ceil(Math.max(...xs) + margin))
    const top = Math.max(0, Math.floor(Math.min(...ys) - margin / aspect)), bottom = Math.min(rows - 1, Math.ceil(Math.max(...ys) + margin / aspect))
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      let best = Infinity, t = 0, side = 1, angle = fish.angle
      for (let j = 0; j < JOINTS - 1; j++) {
        const a = segments[j], { dx, dy } = a
        const px = x - a.x, py = (y - a.y) * aspect
        const at = clamp((px * dx + py * dy) * a.inverseSquared, 0, 1)
        const distance = (px - dx * at) ** 2 + (py - dy * at) ** 2
        if (distance < best) { best = distance; t = (j + at) / (JOINTS - 1); side = dx * py - dy * px >= 0 ? 1 : -1; angle = a.angle }
      }
      let lateral = Math.sqrt(best) * side
      // Beyond an endpoint, keep the tangent coordinate instead of wrapping a fin around it.
      if (t === 0 || t === 1) {
        const end = spine[t === 0 ? 0 : JOINTS - 1], near = spine[t === 0 ? 1 : JOINTS - 2]
        const dx = (t === 0 ? near.x - end.x : end.x - near.x), dy = (t === 0 ? near.y - end.y : end.y - near.y) * aspect
        const length = Math.hypot(dx, dy) || 1, px = x - end.x, py = (y - end.y) * aspect
        t += (px * dx + py * dy) / length / (25 * s)
        lateral = (dx * py - dy * px) / length
      }
      const u = 8 - t * 25, v = lateral / s, width = bodyWidth(u)
      if (u > -10 && u < 8 && Math.abs(v) <= width) {
        const nx = -(bodyHeight(u + .1, v) - bodyHeight(u - .1, v)) / .2
        const ny = -(bodyHeight(u, v + .1) - bodyHeight(u, v - .1)) / .2
        const normal = Math.hypot(nx, ny, 1), cos = Math.cos(angle), sin = Math.sin(angle)
        const diffuse = Math.max(0, (-.35 * (nx * cos - ny * sin) - .45 * (nx * sin + ny * cos) + .82) / normal)
        const across = v * 1.6, row = Math.floor(across), cross = across - row
        const along = (u + 10) * 1.7 + (row & 1) * .5, scale = along - Math.floor(along)
        const scaleSeam = u < 4 && Math.abs(scale - (.5 + .34 * Math.cos((cross - .5) * Math.PI))) < .13
        const ridge = Math.abs(v) < .19 && u < 3.2 && u > -6
        const lateralLine = Math.abs(Math.abs(v) / width - .77) < .05 && u < 2.5
        let light = .39 + diffuse * .55 - (scaleSeam ? .13 : 0) + (cross < .25 && u < 4 ? .035 : 0)
        light += Math.exp(-((u - 1.4) ** 2 / 30 + (v + .7) ** 2 / .35)) * .1
        if (ridge) light -= .13
        if (lateralLine) light -= .08
        light = clamp(light, 0, 1)
        const patch = Math.sin(u * .53 + fish.phase) + Math.cos(v * .9 + u * .2) + Math.sin(u * 1.2 - v * 1.3 + fish.phase) * .16 > .48
        let family = fish.kind < 2 ? (patch ? 23 : 15) : fish.kind === 2 ? (patch ? 31 : 15) : (patch ? 15 : 31)
        if (fish.kind === 1 && u > 5) family = 23
        const eyeDistance = Math.hypot((u - 6.1) * .9, Math.abs(v) - 1.55), eye = eyeDistance < .31
        const gill = Math.abs(u - 4.1 + v * v * .11) < .19 && Math.abs(v) > .9
        const mouth = u > 7.3 && Math.abs(v) < .55
        if (gill) light *= .64
        const glyph = eye ? 'o' : mouth ? '=' : gill ? ')' : ridge ? '^' : scaleSeam ? (cross < .5 ? '(' : ')')
          : DENSITY[Math.floor(clamp(.15 + light * .8, 0, 1) * (DENSITY.length - 1))]
        put(x, y, glyph, eye || mouth ? 14 : family + Math.floor(light * 7), eye ? 255 : 242)
        if (eyeDistance >= .31 && eyeDistance < .49) put(x, y, '.', 12, 225)
      } else if (u > 5.7 && u < 7.5 && Math.abs(Math.abs(v) - (2.5 - (u - 5.7) * .65)) < .18) {
        put(x, y, v > 0 ? '/' : '\\', 12, 110)
      } else if (u > -2.8 && u < 4 && Math.abs(v) > 2.6) {
        const flutter = .91 + .09 * Math.sin(fish.swimPhase - .7)
        const edge = 3 + 2.5 * Math.sin((u + 2.8) / 6.8 * Math.PI) * flutter
        if (Math.abs(v) < edge) {
          const ray = Math.abs(Math.sin(Math.atan2(v, u - 4.5) * 26)), rim = edge - Math.abs(v) < .24
          put(x, y, rim ? '.' : ray > .78 ? '/' : ':', 39 + Math.floor((rim ? .65 : .15 + ray * .7) * 5), rim ? 100 : 90 + Math.round(ray * 90))
        }
      } else if (u <= -9.5 && u >= -17) {
        const q = (-u - 9.5) / 7.5, fan = .48 + 3.8 * Math.sin(q * Math.PI * .56) ** 1.35
        if (Math.abs(v) < fan && q < .82 + .2 * Math.sin(Math.abs(v) / fan * Math.PI) && !(q > .67 && Math.abs(v) < (q - .67) * 3.5)) {
          const ray = Math.abs(Math.sin(v / fan * 22 + q * 1.7)), rim = fan - Math.abs(v) < .25
          const family = fish.kind === 2 ? 31 : 39, count = fish.kind === 2 ? 7 : 5
          put(x, y, rim ? '.' : ray > .68 ? ';' : ':', family + Math.floor((.2 + ray * .57) * count), rim ? 125 : 165 + Math.round(ray * 60))
        }
      }
    }
  }
  for (const pellet of pond.food) put(pellet.x, pellet.y, time % .8 < .4 ? '.' : '*', 9)
  if (pond.options.environment === 'dusk') {
    for (let i = 0; i < 5; i++) {
      const x = ((i * 53 + time * (1.6 + i * .13)) % (cols + 10)) - 5
      const y = ((i * 19 + Math.sin(time * .32 + i * 2.1) * 3 + 7) % rows)
      put(x, y, i % 2 ? ',' : '.', i % 2 ? 59 : 60)
    }
  }
  if (pond.options.lilies) drawLilyPads(pond, pads, put)
  if (pond.options.lotus) drawLotus(pond, put)
  return { columns: cols, rows, chars, colors, coverage, palette: paletteForEnvironment(pond.options.environment, PALETTE) }
}

function bodyWidth(u) {
  if (u <= -10 || u >= 8) return 0
  return u >= 4 ? 3.15 * Math.sqrt(Math.max(0, 1 - ((u - 4) / 4) ** 2)) : .38 + 2.77 * Math.sin((u + 10) / 14 * Math.PI / 2) ** 1.5
}
function bodyHeight(u, v) {
  const width = bodyWidth(u)
  return width > 0 ? width * .55 * Math.sqrt(Math.max(0, 1 - (v / width) ** 2)) : 0
}


const instances = new WeakMap()
const bounded = n => Math.max(0, Math.min(1, n))

function createKoiPond(canvas, options = {}) {
  if (!canvas || typeof canvas.getContext !== 'function' || !canvas.ownerDocument?.defaultView) throw new TypeError('Expected a canvas element')
  if (instances.has(canvas)) throw new Error('This canvas already has a pond; destroy it before creating another')
  const settings = validateOptions(options)
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('A 2D canvas context is required')
  const win = canvas.ownerDocument.defaultView, doc = canvas.ownerDocument
  const media = win.matchMedia('(prefers-reduced-motion: reduce)')
  const listeners = new win.AbortController()
  let pond = createPond(120, 44, 1.6, { ...settings, paused: settings.paused || media.matches })
  let destroyed = false, raf = 0, previous = 0, inView = true, width = 0, height = 0, cellX = 3, cellY = 4.8
  let down, keyboardCursor, lastPoint, lastStir = -Infinity, palette, fromPalette, paletteTime = 0
  const saved = Object.fromEntries(['tabindex', 'role', 'aria-label'].map(key => [key, canvas.getAttribute(key)]))
  const originalTouchAction = canvas.style.touchAction
  const originalCursor = canvas.style.cursor
  canvas.style.touchAction = 'pan-y'

  const alive = () => { if (destroyed) throw new Error('This pond has been destroyed') }
  const state = () => Object.freeze({ ...pond.options, paused: pond.paused, foodCount: pond.food.length, eaten: pond.eaten, destroyed })
  const announce = () => {
    canvas.tabIndex = pond.options.interactive ? 0 : -1
    canvas.style.cursor = pond.options.interactive ? 'crosshair' : 'default'
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', `ASCII pond with ${pond.fish.length} koi${pond.options.lilies ? ', lily pads' : ''}${pond.options.lotus ? ' and a lotus' : ''}. ${pond.paused ? 'Paused.' : 'Swimming.'} ${pond.options.interactive ? 'Move or drag to stir, click to feed. Arrow keys move a cursor, Enter feeds, Space pauses, R resets.' : ''}`)
    canvas.dispatchEvent(new win.CustomEvent('pondchange', { detail: state(), bubbles: true, composed: true }))
  }
  const mixPalette = (next, now) => {
    if (!fromPalette || pond.paused || media.matches) { fromPalette = undefined; return next }
    const t = bounded((now - paletteTime) / 420), ease = 1 - (1 - t) ** 3
    if (t === 1) { fromPalette = undefined; return next }
    return next.map((color, i) => {
      const old = fromPalette[i] || color
      return '#' + [1, 3, 5].map(c => Math.round(parseInt(old.slice(c, c + 2), 16) * (1 - ease) + parseInt(color.slice(c, c + 2), 16) * ease).toString(16).padStart(2, '0')).join('')
    })
  }
  const paint = (now = win.performance.now()) => {
    if (destroyed || !width || !height) return
    const frame = renderPond(pond)
    palette = mixPalette(frame.palette, now)
    ctx.fillStyle = palette[0]; ctx.fillRect(0, 0, width, height)
    for (let y = 0; y < frame.rows; y++) for (let x = 0; x < frame.columns; x++) {
      const i = y * frame.columns + x
      if (frame.chars[i] === 32) continue
      ctx.fillStyle = palette[frame.colors[i]]
      if (frame.coverage[i]) {
        ctx.globalAlpha = frame.coverage[i] / 255
        ctx.fillRect(x * cellX + .1, y * cellY + .1, cellX - .2, cellY - .2)
        ctx.globalAlpha = 1
      }
      if (frame.coverage[i] > 128) ctx.fillStyle = frame.colors[i] >= 59 ? 'rgba(74,27,48,.3)' : frame.colors[i] >= 45 ? 'rgba(5,22,12,.4)' : 'rgba(55,47,35,.28)'
      ctx.fillText(String.fromCharCode(frame.chars[i]), (x + .5) * cellX, (y + .5) * cellY)
    }
    if (keyboardCursor && pond.options.interactive) {
      ctx.fillStyle = palette[9]
      ctx.font = `500 ${Math.max(10, cellY)}px monospace`
      ctx.fillText('+', keyboardCursor.x * width, keyboardCursor.y * height)
      ctx.font = `500 ${cellY * .78}px ui-monospace, Consolas, monospace`
    }
  }
  const stop = () => { if (raf) win.cancelAnimationFrame(raf); raf = 0; previous = 0 }
  const canRun = () => !destroyed && !pond.paused && !doc.hidden && inView && width > 0 && height > 0
  const tick = now => {
    raf = 0
    if (!canRun()) return
    if (!previous) previous = now
    if (now - previous >= 1000 / 60 - 1) {
      const eaten = pond.eaten, foodCount = pond.food.length
      advance(pond, Math.min((now - previous) / 1000, .1)); previous = now
      paint(now)
      if (pond.eaten !== eaten || pond.food.length !== foodCount) announce()
    }
    raf = win.requestAnimationFrame(tick)
  }
  const resume = () => { stop(); if (canRun()) raf = win.requestAnimationFrame(tick) }
  const size = () => {
    if (destroyed) return
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(win.devicePixelRatio || 1, 2)
    width = rect.width; height = rect.height
    if (!width || !height) { stop(); return }
    const fine = pond.options.detail === 'fine', maximum = fine ? 480 : 300
    cellX = Math.max(fine ? 2.5 : 4, Math.min(fine ? 4 : 6, width / (fine ? 280 : 180)), width / maximum)
    cellY = cellX * 1.6
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.font = `500 ${cellY * .78}px ui-monospace, Consolas, monospace`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    pond.aspect = cellY / cellX
    resizePond(pond, Math.max(20, Math.floor(width / cellX)), Math.max(12, Math.floor(height / cellY)))
    paint(); resume()
  }
  const coordinates = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError('Pond coordinates must be finite numbers from 0 to 1')
    return { x: bounded(x), y: bounded(y) }
  }
  const point = event => {
    const rect = canvas.getBoundingClientRect()
    return coordinates((event.clientX - rect.left) / (rect.width || 1), (event.clientY - rect.top) / (rect.height || 1))
  }
  const drop = (x, y) => {
    alive(); const p = coordinates(x, y)
    feed(pond, p.x * pond.columns, p.y * pond.rows); paint(); announce()
  }
  const ripple = (x, y, strength = .5) => {
    alive(); const p = coordinates(x, y)
    if (!Number.isFinite(strength) || strength < 0 || strength > 1) throw new RangeError('Ripple strength must be between 0 and 1')
    disturb(pond, p.x * pond.columns, p.y * pond.rows, strength); paint()
  }
  const on = (target, name, callback) => target.addEventListener(name, callback, { signal: listeners.signal })
  on(canvas, 'pointerdown', event => {
    if (!pond.options.interactive || event.button !== 0 || event.isPrimary === false || event.ctrlKey || event.metaKey || event.altKey) return
    down = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, type: event.pointerType }
    if (event.pointerType === 'mouse') {
      try { canvas.setPointerCapture?.(event.pointerId) } catch { /* Synthetic events have no active pointer to capture. */ }
    }
  })
  on(canvas, 'pointermove', event => {
    if (!pond.options.interactive || event.isPrimary === false) return
    if (down && down.id !== event.pointerId) return
    const dx = down ? event.clientX - down.x : 0, dy = down ? event.clientY - down.y : 0
    if (down && Math.hypot(dx, dy) >= 6) down.moved = true
    if (event.pointerType === 'touch' && (!down || Math.abs(dy) > Math.abs(dx))) return
    const p = point(event), now = win.performance.now()
    keyboardCursor = undefined
    const distance = lastPoint ? Math.hypot((p.x - lastPoint.x) * width, (p.y - lastPoint.y) * height) : 6
    if (now - lastStir >= 65 && distance >= 4) {
      const velocity = lastPoint ? distance / Math.max(16, now - lastStir) : .1
      disturb(pond, p.x * pond.columns, p.y * pond.rows, Math.min(.8, .25 + velocity * .18))
      lastPoint = p; lastStir = now
      if (pond.paused) paint()
    }
  })
  on(canvas, 'pointerup', event => {
    const start = down
    if (!start || start.id !== event.pointerId) return
    down = undefined
    if (pond.options.interactive && event.button === 0 && !start.moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 6) {
      const p = point(event); drop(p.x, p.y)
    }
  })
  on(canvas, 'pointercancel', () => { down = undefined; lastPoint = undefined })
  on(canvas, 'lostpointercapture', () => { down = undefined })
  on(canvas, 'pointerleave', () => { lastPoint = undefined })
  on(canvas, 'keydown', event => {
    if (!pond.options.interactive || event.altKey || event.ctrlKey || event.metaKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'r', 'R'].includes(event.key)) return
    event.preventDefault()
    if (event.key === ' ') { if (!event.repeat) controller.toggle(); return }
    if (event.key.toLowerCase() === 'r') { if (!event.repeat) controller.reset(); return }
    keyboardCursor ||= { x: .5, y: .5 }
    if (event.key === 'Enter') drop(keyboardCursor.x, keyboardCursor.y)
    else {
      keyboardCursor.x = bounded(keyboardCursor.x + (event.key === 'ArrowRight' ? .025 : event.key === 'ArrowLeft' ? -.025 : 0))
      keyboardCursor.y = bounded(keyboardCursor.y + (event.key === 'ArrowDown' ? .025 : event.key === 'ArrowUp' ? -.025 : 0))
      paint()
    }
  })
  on(doc, 'visibilitychange', resume)
  on(win, 'resize', size)
  const reducedMotion = () => { if (media.matches) controller.pause() }
  media.addEventListener('change', reducedMotion)
  const resize = new win.ResizeObserver(size)
  resize.observe(canvas)
  const intersection = win.IntersectionObserver ? new win.IntersectionObserver(entries => { inView = entries.some(entry => entry.isIntersecting); resume() }) : null
  intersection?.observe(canvas)

  const controller = {
    getState: state,
    setOptions(partial) {
      alive()
      const next = validateOptions(partial, pond.options), environmentChanged = next.environment !== pond.options.environment, detailChanged = next.detail !== pond.options.detail
      if (environmentChanged) { fromPalette = palette?.slice(); paletteTime = win.performance.now() }
      configurePond(pond, partial)
      down = undefined
      if (detailChanged) size()
      else {
        paint()
        if (pond.paused) stop()
        else if (!raf && canRun()) resume()
      }
      announce()
      return state()
    },
    play() { return controller.setOptions({ paused: false }) },
    pause() { return controller.setOptions({ paused: true }) },
    toggle() { return controller.setOptions({ paused: !pond.paused }) },
    reset() {
      alive(); pond = createPond(pond.columns, pond.rows, pond.aspect, pond.options)
      keyboardCursor = undefined; down = undefined; lastPoint = undefined
      paint(); resume(); announce()
      return state()
    },
    feed: drop,
    ripple,
    exportPNG() { alive(); paint(); return canvas.toDataURL('image/png') },
    destroy() {
      if (destroyed) return
      if (down && canvas.hasPointerCapture?.(down.id)) canvas.releasePointerCapture(down.id)
      down = undefined
      stop(); destroyed = true; listeners.abort(); resize.disconnect(); intersection?.disconnect()
      media.removeEventListener('change', reducedMotion)
      for (const [key, value] of Object.entries(saved)) { if (value === null) canvas.removeAttribute(key); else canvas.setAttribute(key, value) }
      canvas.style.touchAction = originalTouchAction
      canvas.style.cursor = originalCursor
      instances.delete(canvas)
    },
  }
  instances.set(canvas, controller)
  size(); announce()
  return Object.freeze(controller)
}


const attributes = { environment: 'environment', speed: 'speed', 'fish-count': 'fishCount', lilies: 'lilies', lotus: 'lotus', detail: 'detail', paused: 'paused', interactive: 'interactive' }
const booleans = new Set(['lilies', 'lotus', 'paused', 'interactive'])
const HTMLElementBase = globalThis.HTMLElement || class {}

function parseAttribute(name, value) {
  if (value === null) return undefined
  if (booleans.has(name)) {
    if (value === '' || value === 'true') return true
    if (value === 'false') return false
    throw new TypeError(`${name} must be true or false`)
  }
  if (name === 'speed' || name === 'fish-count') return value.trim() === '' ? NaN : Number(value)
  return value
}

class KoiPondElement extends HTMLElementBase {
  static get observedAttributes() { return Object.keys(attributes) }
  constructor() {
    super()
    this.pond = null
    const root = this.attachShadow({ mode: 'open' })
    root.innerHTML = `<style>:host{display:block;height:480px;min-width:0;overflow:hidden;border-radius:inherit;background:#000;contain:layout paint}canvas{display:block;width:100%;height:100%;touch-action:pan-y;outline-offset:-3px}canvas:focus-visible{outline:2px solid #d9ad82}.status{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}</style><canvas part="canvas">An interactive ASCII pond. Use arrow keys and Enter to feed koi, Space to pause.</canvas><span class="status" role="status" aria-live="polite"></span>`
    this.canvas = root.querySelector('canvas')
    const status = root.querySelector('.status')
    this.canvas.addEventListener('pondchange', event => {
      const s = event.detail
      status.textContent = `${s.paused ? 'Paused' : 'Swimming'}. ${s.fishCount} koi. ${s.foodCount ? 'Food in the pond.' : ''}`
    })
  }
  connectedCallback() {
    if (this.pond) return
    try {
      const options = {}
      for (const [name, key] of Object.entries(attributes)) {
        const value = parseAttribute(name, this.getAttribute(name))
        if (value !== undefined) options[key] = value
      }
      this.pond = createKoiPond(this.canvas, options)
    } catch (error) { this.report(error) }
  }
  disconnectedCallback() { this.pond?.destroy(); this.pond = null }
  attributeChangedCallback(name, oldValue, value) {
    if (oldValue === value) return
    if (!this.pond) { if (this.isConnected) this.connectedCallback(); return }
    try {
      const parsed = parseAttribute(name, value)
      const defaults = { environment: 'midnight', speed: 1.35, fishCount: 7, lilies: true, lotus: true, detail: 'fine', paused: false, interactive: true }
      this.pond.setOptions({ [attributes[name]]: parsed === undefined ? defaults[attributes[name]] : parsed })
    } catch (error) { this.report(error) }
  }
  report(error) {
    this.dispatchEvent(new this.ownerDocument.defaultView.CustomEvent('ponderror', { detail: { message: error.message }, bubbles: true, composed: true }))
  }
}

function registerKoiPond(tagName = 'koi-pond') {
  if (!globalThis.customElements) return undefined
  const registered = globalThis.customElements.get(tagName)
  if (registered) return registered
  // Each alias needs its own constructor in the custom-element registry.
  const Element = tagName === 'koi-pond' ? KoiPondElement : class extends KoiPondElement {}
  globalThis.customElements.define(tagName, Element)
  return Element
}

export { createKoiPond, registerKoiPond, KoiPondElement, ENVIRONMENTS };
if (globalThis.customElements && globalThis.HTMLElement) registerKoiPond();
