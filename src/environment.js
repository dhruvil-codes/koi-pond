import { clamp, hash } from './math.js'
import { resolveEnvironment } from './environments.js'

const envDewdrops = [[-.31, -.24, .068], [.23, .39, .045]]

function envDrawLilyPads(pond, pads, put, shadows = false) {
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
          for (const [du, dv, size] of envDewdrops) {
            const distance = Math.hypot(u - du, v - dv)
            if (distance < size) put(x, y, distance < size * .35 ? '.' : 'o', distance < size * .35 ? 58 : 57, 215)
          }
        }
      }
    }
  }
}

function envDrawLotus(pond, put, envFlower) {
  const { columns, rows, aspect, time } = pond
  const r = columns * envFlower[2], cx = columns * envFlower[0], cy = rows * envFlower[1]
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

const envCache = new WeakMap()
const envPadLayout = [
  [.805, .16, .046, -2.3, .84], [.881, .255, .036, 2.5, .92], [.785, .337, .032, -.9, .88],
  [.045, .885, .033, -.4, .86], [.16, .925, .034, -2.5, .86], [.092, .946, .025, .8, .82],
  [.80, .733, .036, -2.7, .89], [.878, .805, .027, -1.2, .83], [.734, .821, .023, .65, .91],
  [.925, .09, .021, .8, .8], [.829, .287, .027, -1.7, .83], [.125, .86, .028, 1.3, .91],
  [.87, .185, .028, 1.4, .88], [.20, .953, .022, -2, .9], [.675, .07, .023, 2.5, .87],
  [.93, .713, .024, .5, .9], [.72, .897, .025, 2, .86], [.064, .802, .025, 1, .85],
]
const envFlowerLayout = [[.829, .268, .036], [.12, .845, .035], [.89, .145, .029], [.767, .79, .03], [.195, .92, .027], [.69, .105, .027]]

function envLine(pond, put, ax, ay, bx, by, width, family, glyph = ':') {
  const dx = bx - ax, dy = (by - ay) * pond.aspect, distance = Math.hypot(dx, dy)
  const steps = Math.max(1, Math.ceil(distance * 1.5))
  for (let step = 0; step <= steps; step++) {
    const t = step / steps, cx = ax + (bx - ax) * t, cy = ay + (by - ay) * t, r = Math.max(.4, width * (1 - t * .55))
    for (let y = Math.floor(cy - r / pond.aspect); y <= Math.ceil(cy + r / pond.aspect); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const nx = (x - cx) / r, ny = (y - cy) * pond.aspect / r
      if (nx * nx + ny * ny > 1.1) continue
      put(x, y, glyph, family + Math.floor(clamp(.45 - nx * .2 - ny * .25 + hash(x, y) * .15, 0, .99) * 7), 242)
    }
  }
}

function envRock(pond, put, nx, ny, rx, ry, seed) {
  const cx = nx * pond.columns, cy = ny * pond.rows, w = rx * pond.columns, h = ry * pond.rows
  for (let y = Math.max(0, Math.floor(cy - h)); y <= Math.min(pond.rows - 1, Math.ceil(cy + h)); y++) for (let x = Math.max(0, Math.floor(cx - w)); x <= Math.min(pond.columns - 1, Math.ceil(cx + w)); x++) {
    const u = (x - cx) / w, v = (y - cy) / h, angle = Math.atan2(v, u)
    const edge = 1 + .075 * Math.sin(angle * 5 + seed) + .035 * Math.cos(angle * 9 - seed)
    const radius = Math.hypot(u, v)
    if (radius > edge) continue
    const grain = hash(x + seed, y), facet = Math.floor((u + Math.sin(v * 4 + seed) * .13) * 9)
    const crack = Math.abs(Math.sin(u * 14 + Math.sin(v * 5 + seed) * .7)) < .105
    let light = .6 - u * .23 - v * .33 - radius * .14 + (grain - .5) * .2 + (facet % 3) * .045
    if (crack) light -= .3
    if (radius > edge - .09) light -= .15
    const moss = v < -.18 && grain + Math.sin(u * 15 + seed) * .17 > .47 + (v + .65) * .4
    const color = moss ? 119 + Math.floor(clamp(.48 - v * .33 - u * .15 + grain * .16, 0, .99) * 11) : 107 + Math.floor(clamp(light, 0, .99) * 11)
    put(x, y, crack ? '|' : moss ? grain > .75 ? '*' : ':' : grain > .82 ? ';' : grain > .53 ? ':' : '.', color, 250)
  }
}

function envFoliage(pond, put, cx, cy, radius, maple, seed) {
  const r = Math.max(1.3, radius), aspect = pond.aspect
  for (let y = Math.floor(cy - r / aspect); y <= Math.ceil(cy + r / aspect); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    const u = (x - cx) / r, v = (y - cy) * aspect / r, a = Math.atan2(v, u) + seed
    const boundary = maple ? .52 + .46 * Math.max(0, Math.cos(5 * a)) : .66 + .31 * Math.cos(a * 5)
    const d = Math.hypot(u, v)
    if (d > boundary) continue
    const light = clamp(.5 - u * .19 - v * .24 + hash(x + seed * 100, y) * .22, 0, .99)
    put(x, y, d < .2 ? '*' : maple ? Math.abs(Math.sin(a * 5)) < .2 ? '/' : ':' : '.', (maple ? 151 : 139) + Math.floor(light * 11), 248)
    if (!maple && d < .2) put(x, y, '*', 190, 255)
  }
}

function envCanopy(pond, put, scene, seed, fine) {
  const branches = [
    [-.015, .185, .08, .13, .19, .025, .315, .005, 1.7],
    [-.03, .02, .085, .08, .20, .115, .34, .18, 1.35],
    [.005, .12, .016, .19, .029, .25, .092, .285, .9],
    [.075, .115, .098, .05, .125, .025, .13, -.025, .8],
    [.155, .064, .18, .025, .198, .015, .215, -.02, .7],
    [.14, .10, .185, .145, .21, .145, .25, .13, .6],
  ]
  for (let b = 0; b < branches.length; b++) {
    const branch = branches[b], points = [], segments = 28
    for (let i = 0; i <= segments; i++) {
      const t = i / segments, q = 1 - t
      points.push([(q ** 3 * branch[0] + 3 * q * q * t * branch[2] + 3 * q * t * t * branch[4] + t ** 3 * branch[6]) * pond.columns, (q ** 3 * branch[1] + 3 * q * q * t * branch[3] + 3 * q * t * t * branch[5] + t ** 3 * branch[7]) * pond.rows])
    }
    for (let i = 1; i < points.length; i++) envLine(pond, put, ...points[i - 1], ...points[i], branch[8] * pond.columns / 280 * (1 - i / points.length * .73), 131)
    const spacing = scene === 'sakura' ? 2 : scene === 'autumn' ? 3 : 4
    for (let i = 3; i < points.length; i += fine ? spacing : spacing + 1) {
      const p = points[i], side = i % 2 ? 1 : -1, jitter = hash(i + seed, b)
      const tx = p[0] + (jitter - .5) * pond.columns * .018, ty = p[1] + side * pond.rows * (.014 + jitter * .019)
      envLine(pond, put, p[0], p[1], tx, ty, .55, 131)
      envFoliage(pond, put, tx, ty, pond.columns * (scene === 'autumn' ? .013 : .0085 + jitter * .003), scene === 'autumn', b + i * .17)
      if (scene === 'sakura' || jitter > .45) envFoliage(pond, put, tx + pond.columns * .007, ty - pond.rows * .009, pond.columns * .0055, scene === 'autumn', b + i)
    }
  }
}

function envReeds(pond, put, scene, seed) {
  for (let bank = 0; bank < 3; bank++) for (let i = 0; i < (bank === 1 ? 18 : 11); i++) {
    const n = hash(i + seed, bank + 199), cx = (bank === 0 ? .987 - n * .045 : bank === 1 ? .925 + n * .08 : n * .018) * pond.columns
    const cy = (bank === 0 ? .86 + n * .1 : bank === 1 ? 1.03 : .39 + n * .05) * pond.rows
    const length = pond.rows * (.055 + hash(i + seed, bank + 33) * .10), lean = (hash(i, bank + seed) - .5) * pond.columns * .047
    for (let step = 0; step <= length; step += .5) {
      const t = step / length, x = cx + lean * t * t, y = cy - step
      put(x, y, Math.abs(lean) < 1 ? '|' : lean > 0 ? '/' : '\\', 175 + Math.floor(clamp(.25 + t * .55 + n * .2, 0, .99) * 9), 222)
      if (i % 4 === 0 && t > .76) put(x + .8, y, ':', scene === 'autumn' ? 160 : 181, 225)
    }
  }
}

function envBuild(pond, key) {
  const { columns, rows, aspect } = pond, options = pond.options || {}, scene = resolveEnvironment(options.environment || 'zen')
  const seed = (options.seed ?? 2026) >>> 0, fine = options.detail !== 'balanced', total = columns * rows
  const back = { chars: new Uint8Array(total).fill(32), colors: new Uint8Array(total), coverage: new Uint8Array(total) }
  const front = { chars: new Uint8Array(total).fill(32), colors: new Uint8Array(total), coverage: new Uint8Array(total) }
  const paint = layer => (x, y, glyph, color, coverage = 0) => {
    x = Math.round(x); y = Math.round(y)
    if (x >= 0 && x < columns && y >= 0 && y < rows) { const i = y * columns + x; layer.chars[i] = glyph.charCodeAt(0); layer.colors[i] = color; layer.coverage[i] = coverage }
  }
  const backPut = paint(back), frontPut = paint(front), shimmer = []
  const xWaves = Array.from({ length: columns }, (_, x) => [Math.sin(x * .045 + seed % 17), Math.sin(x * .113), Math.cos(x * .023)])
  for (let y = 0; y < rows; y++) {
    const bend = Math.sin(y * .07 + seed % 11) * 1.9, sy = Math.sin(y * .11), cy = Math.cos(y * .11)
    for (let x = 0; x < columns; x++) {
      const waves = xWaves[x], coarse = waves[0] * cy + waves[2] * sy + Math.sin(y * .15 + waves[1] * 1.3)
      const grain = hash(Math.floor(x / 3) + seed, Math.floor(y / 2)), light = clamp(.36 + coarse * .15 + grain * .13, .05, .95)
      // Quiet solid material carries the water's depth; actual ink follows a few caustic contours.
      backPut(x, y, ' ', 91 + Math.floor(light * 14), 90 + Math.round(light * 105))
      const contour = Math.sin(x * .055 + y * .105 + bend + waves[0] * 1.8)
      if (contour > .957 && grain > .24) backPut(x, y, hash(x, y) > .65 ? '-' : '.', 98 + Math.floor(light * 6), 150)
      if (scene === 'daylight' && fine && x % 3 === 0 && y % 2 === 0 && contour > .83 && hash(x + seed, y + 53) > .72) {
        backPut(x, y, '.', 166 + Math.floor(hash(x, y + seed) * 5), 82)
      }
      if (fine && x % 3 === 0 && y % 2 === 0 && grain > .65) shimmer.push([x, y, x * .027 + y * .09 + grain * 5])
    }
  }
  // Submerged bank shadows sit beneath the rock geometry and remain out of the fish layer.
  for (const [cx, cy, rx, ry] of [[-.01, .44, .10, .10], [.96, 1.01, .21, .19]]) {
    for (let y = Math.max(0, Math.floor((cy - ry) * rows)); y < Math.min(rows, Math.ceil((cy + ry) * rows)); y++) for (let x = Math.max(0, Math.floor((cx - rx) * columns)); x < Math.min(columns, Math.ceil((cx + rx) * columns)); x++) {
      const d = Math.hypot((x / columns - cx) / rx, (y / rows - cy) / ry)
      if (d < 1) backPut(x, y, ' ', 91, Math.round((1 - d) * 170))
    }
  }
  const rocks = [[-.014, .428, .069, .058], [.044, .357, .034, .033], [.008, .383, .038, .041], [.855, 1.018, .085, .079], [.932, .973, .075, .075], [.991, .90, .056, .083], [.895, .94, .041, .035]]
  for (let i = 0; i < rocks.length; i++) envRock(pond, frontPut, ...rocks[i], i * 13 + seed % 47)
  envReeds(pond, frontPut, scene, seed)
  envCanopy(pond, frontPut, scene, seed, fine)
  const density = options.lilies === false ? 0 : options.lilyDensity ?? .7
  const count = Math.round(density * envPadLayout.length)
  const pads = envPadLayout.slice(0, count).map(([x, y, radius, rotation, flatten], i) => ({
    x: (x + (hash(i + seed, 178) - .5) * .011) * columns,
    y: (y + (hash(i + seed, 812) - .5) * .012) * rows,
    radius: radius * columns, cos: Math.cos(rotation), sin: Math.sin(rotation), flatten, phase: i * 2.39,
  }))
  envDrawLilyPads(pond, pads, backPut, true)
  envDrawLilyPads(pond, pads, frontPut)
  const flowerCount = options.lotus === false ? 0 : options.lotusCount ?? 2
  // Static painter time avoids rebuilding thousands of petal cells for sub-cell movement.
  const still = { columns, rows, aspect, time: 0 }
  for (let i = 0; i < flowerCount; i++) envDrawLotus(still, frontPut, envFlowerLayout[i])
  const frontCells = []
  for (let i = 0; i < total; i++) if (front.coverage[i] || front.chars[i] !== 32) frontCells.push(i)
  return { key, back, front, frontCells, shimmer }
}

function envGet(pond) {
  const options = pond.options || {}
  const key = [pond.columns, pond.rows, pond.aspect, resolveEnvironment(options.environment || 'zen'), options.seed ?? 2026, options.detail, options.lilies, options.lilyDensity ?? .7, options.lotus, options.lotusCount ?? 2].join('|')
  let cached = envCache.get(pond)
  if (!cached || cached.key !== key) { cached = envBuild(pond, key); envCache.set(pond, cached) }
  return cached
}

function envRing(pond, put, cx, cy, radius, color, strength = 1) {
  if (radius < .2) return
  const segments = Math.max(12, Math.ceil(radius * Math.PI * 2 / .85))
  for (let i = 0; i < segments; i++) {
    const angle = i / segments * Math.PI * 2
    if (hash(i, Math.floor(radius * 3)) < .14) continue
    put(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius / pond.aspect, '.', color, Math.round(90 + 70 * Math.min(1, strength)))
  }
}

function envReflection(pond, put, scene) {
  if (scene === 'zen') return
  if (scene === 'daylight') {
    const { columns: cols, rows, time } = pond, seed = pond.options.seed ?? 2026
    // A broadening trail of broken, sun-warmed dashes across the open water.
    for (let y = 0; y < rows * .72; y++) {
      const t = y / (rows * .72)
      if (hash(y + seed, 718) < .19 + t * .18) continue
      const center = cols * (.72 - t * .16) + Math.sin(y * .27 + time * .38) * cols * .009
      const width = cols * (.012 + t * .065)
      for (let dx = -width; dx <= width; dx++) {
        const x = Math.round(center + dx)
        const fleck = hash(x + Math.floor(time * .7), y + seed)
        if (fleck < .69 + Math.abs(dx) / width * .17) continue
        const light = clamp(.48 + (1 - Math.abs(dx) / width) * .32 + fleck * .2, 0, .99)
        put(x, y, fleck > .94 ? '*' : '-', 163 + Math.floor(light * 11), Math.round(110 + light * 110))
      }
    }
    return
  }
  const cols = pond.columns, rows = pond.rows, time = pond.time || 0, center = scene === 'autumn' ? .57 : .615
  const reach = scene === 'moonlight' ? .49 : .58
  for (let y = 0; y < rows * reach; y++) {
    const t = y / (rows * reach), drift = Math.sin(y * .51 + time * .48) * cols * (.006 + t * .008)
    const width = cols * (.025 * (1 - t) + .006) * (.55 + hash(y, 284) * .65)
    const x = cols * center + drift
    if (hash(y, 718) < .22 + t * .3) continue
    for (let dx = -width; dx < width; dx++) {
      if (hash(Math.floor(dx * .5) + Math.floor(time * .6), y) < .23) continue
      const brightness = clamp((1 - t) * .85 + hash(Math.floor(dx), y) * .2 - Math.abs(dx) / width * .3, 0, .99)
      put(x + dx, y, Math.abs(dx) < width * .5 ? '-' : '.', 163 + Math.floor(brightness * 11), Math.round(70 + brightness * (scene === 'moonlight' ? 155 : 105)))
    }
    if (y % 4 === 0 && t < .5) put(x - width * 2.1, y, '.', 165, 45)
  }
}

export function paintEnvironmentBack(pond, frame, put) {
  const cached = envGet(pond), time = pond.time || 0, options = pond.options || {}, scene = resolveEnvironment(options.environment || 'zen')
  frame.chars.set(cached.back.chars); frame.colors.set(cached.back.colors); frame.coverage.set(cached.back.coverage)
  const intensity = options.rippleIntensity ?? 1
  if (intensity > 0) {
    for (const [x, y, phase] of cached.shimmer) {
      const light = Math.sin(time * .24 + phase)
      if (light > .94) put(x + Math.sin(time * .08 + phase) * .6, y, '.', 100 + Math.floor((light - .94) * 60), 65)
    }
    // Wide, broken surface rings echo the reference without covering its open swimming area.
    for (let i = 0; i < 3; i++) {
      const pulse = ((time * .009 + i * .19) % .72), radius = pond.columns * (.11 + pulse * .37)
      envRing(pond, put, pond.columns * [.4, .73, .16][i], pond.rows * [.71, .78, .91][i], radius, 102 + Math.floor(intensity), intensity * .45)
    }
    for (const ripple of pond.ripples || []) {
      const radius = ripple.age * pond.columns * .078, strength = (ripple.strength ?? 1) * intensity
      const color = ripple.age < .8 && strength > .8 ? 10 : ripple.age < 2 ? 3 : ripple.age < 3.5 ? 2 : 1
      if (ripple.age > .04) envRing(pond, put, ripple.x, ripple.y, radius, color, strength)
      if (ripple.age > .3) envRing(pond, put, ripple.x, ripple.y, radius * .72, ripple.age < 2 ? 2 : 1, strength * .7)
    }
  }
  envReflection(pond, put, scene)
}

export function paintEnvironmentFront(pond, frame, put) {
  const cached = envGet(pond), options = pond.options || {}, time = pond.time || 0, cols = pond.columns, rows = pond.rows
  for (const i of cached.frontCells) { frame.chars[i] = cached.front.chars[i]; frame.colors[i] = cached.front.colors[i]; frame.coverage[i] = cached.front.coverage[i] }
  const scene = resolveEnvironment(options.environment || 'zen'), density = options.particleDensity ?? .45
  const count = Math.round(density * (scene === 'zen' ? 13 : scene === 'moonlight' || scene === 'autumn' ? 28 : 38))
  const seed = options.seed ?? 2026
  for (let i = 0; i < count; i++) {
    const phase = hash(i + seed, 923) * Math.PI * 2, speed = .17 + hash(i, seed + 82) * .2
    const x = ((hash(i + seed, 47) * cols + time * speed + Math.sin(time * .19 + phase) * cols * .008) % (cols + 8)) - 4
    const y = (hash(i + seed, 139) * rows + Math.sin(time * .15 + phase) * rows * .012 + time * (scene === 'moonlight' ? 0 : .065)) % rows
    if (scene === 'moonlight') {
      const glow = .5 + .5 * Math.sin(time * .9 + phase), color = 185 + Math.floor(glow * 5)
      put(x, y, '.', color, Math.round(100 + glow * 130))
      if (glow > .72) { put(x - 1, y, '.', 185, 40); put(x + 1, y, '.', 185, 40) }
    } else if (scene === 'daylight') {
      put(x, y, i % 4 ? '.' : '*', 185 + i % 6, 140 + i % 4 * 20)
    } else if (scene === 'autumn') envFoliage(pond, put, x, y, Math.max(2.1, cols * .013), true, phase + Math.sin(time * .12) * .2)
    else if (scene === 'sakura') {
      put(x, y, i % 2 ? ',' : '/', 145 + i % 6, 220)
      if (cols > 220 && i % 3 === 0) put(x + 1, y, '.', 147, 170)
    } else if (i % 2) put(x, y, '.', 124, 70)
    else put(x, y, ',', 141 + i % 6, 125)
  }
}
