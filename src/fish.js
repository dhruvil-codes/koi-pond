import { clamp, wrap, hash } from './math.js'

const FISH_DENSITY = ':;t%SX8#@'
const FISH_JOINTS = 22
const FISH_LAYOUT = [
  { x: .47, y: .24, angle: -.08, speed: 2.35, scale: .62, phase: .5, kind: 0, curve: .105 },
  { x: .33, y: .43, angle: 3.04, speed: 2.8, scale: .92, phase: 2.5, kind: 1, curve: .017 },
  { x: .29, y: .55, angle: -1.92, speed: 2.65, scale: .72, phase: 4.2, kind: 2, curve: -.065 },
  { x: .11, y: .76, angle: 2.25, speed: 2.6, scale: .6, phase: 5.8, kind: 3, curve: -.035 },
  { x: .59, y: .49, angle: -.32, speed: 3.4, scale: .3, phase: 1.2, kind: 2, curve: .026 },
  { x: .68, y: .59, angle: -.52, speed: 3.6, scale: .25, phase: 1.7, kind: 3, curve: .07 },
  { x: .54, y: .74, angle: -.18, speed: 3.3, scale: .32, phase: 3.8, kind: 0, curve: -.03 },
]

export function fishCreate(pond, index) {
  const n = index - 4, reference = FISH_LAYOUT[index]
  const fish = reference ? { ...reference } : {
    x: .18 + (n * .173) % .64, y: .18 + (n * .287) % .64,
    angle: -.2 + n * 1.71, speed: 3.25 + n % 3 * .17, scale: [.3, .25, .32][n % 3],
    phase: 1.1 + n * 1.39, kind: n % 4, curve: [-.03, .026, .07][n % 3],
  }
  if (pond.options.seed !== 2026) {
    const seed = pond.options.seed
    fish.x = .2 + hash(index * 7, seed) * .6
    fish.y = .2 + hash(index * 7 + 1, seed) * .6
    fish.angle = hash(index * 7 + 2, seed) * Math.PI * 2 - Math.PI
    fish.phase = hash(index * 7 + 3, seed) * Math.PI * 2
    fish.curve = (hash(index * 7 + 4, seed) - .5) * .14
  }
  fish.x *= pond.columns; fish.y *= pond.rows
  fish.variety = pond.options.varieties[index % pond.options.varieties.length]
  return fish
}

export function fishInitialize(pond, fish) {
  fish.turnVelocity = 0
  fish.currentSpeed = fish.speed * pond.columns / 100 * pond.options.speed
  fish.swimPhase = fish.phase
  fish.depth = fishCruiseDepth(fish, 0)
  fish.tailEffort = .3
  fish.spine = [{ x: fish.x, y: fish.y }]
  const gap = fishLength(pond, fish) / (FISH_JOINTS - 1)
  for (let j = 1; j < FISH_JOINTS; j++) {
    const previous = fish.spine[j - 1], a = fish.angle + Math.PI + fish.curve * j
    fish.spine.push({ x: previous.x + Math.cos(a) * gap, y: previous.y + Math.sin(a) * gap / pond.aspect })
  }
  fishFollowSpine(pond, fish)
}

export const fishLength = (pond, fish) => 25 * fish.scale * pond.options.fishSize * pond.columns / 112

function fishCruiseDepth(fish, time) {
  return clamp(.46 + .24 * Math.sin(time * .16 + fish.phase * 1.37)
    + .08 * Math.sin(time * .073 + fish.phase * 2.11), .12, .82)
}

export function fishFollowSpine(pond, fish) {
  const gap = fishLength(pond, fish) / (FISH_JOINTS - 1)
  fish.spine[0].x = fish.x; fish.spine[0].y = fish.y
  let backward = fish.angle + Math.PI
  for (let i = 1; i < FISH_JOINTS; i++) {
    const previous = fish.spine[i - 1], node = fish.spine[i]
    const oldAngle = Math.atan2((node.y - previous.y) * pond.aspect, node.x - previous.x)
    let angle = backward + clamp(wrap(oldAngle - backward), -.29, .29)
    let dx = Math.cos(angle) * gap, dy = Math.sin(angle) * gap / pond.aspect
    // Reflect the trailing joint at the bank while retaining its exact connection length.
    if (previous.x + dx < 0 || previous.x + dx > pond.columns) dx = -dx
    if (previous.y + dy < 0 || previous.y + dy > pond.rows) dy = -dy
    node.x = previous.x + dx; node.y = previous.y + dy
    backward = Math.atan2(dy * pond.aspect, dx)
  }
}

export function fishAdvance(pond, dt, disturb) {
  const behavior = pond.options.behavior
  let centerX = 0, centerY = 0, headingX = 0, headingY = 0
  if (behavior === 'school') for (const fish of pond.fish) {
    centerX += fish.x / pond.fish.length; centerY += fish.y / pond.fish.length
    headingX += Math.cos(fish.angle) / pond.fish.length; headingY += Math.sin(fish.angle) / pond.fish.length
  }
  for (const fish of pond.fish) {
    let target = { x: pond.columns * (.5 + .32 * Math.cos(pond.time * .055 + fish.phase)), y: pond.rows * (.5 + .3 * Math.sin(pond.time * .045 + fish.phase)) }
    if (behavior === 'circle') {
      const theta = Math.atan2((fish.y / pond.rows - .5) / .29, (fish.x / pond.columns - .5) / .32) + .65
      target = { x: pond.columns * (.5 + .32 * Math.cos(theta)), y: pond.rows * (.5 + .29 * Math.sin(theta)) }
    } else if (behavior === 'school') {
      target = { x: centerX * .65 + pond.columns * (.5 + .24 * Math.cos(pond.time * .075)) * .35,
        y: centerY * .65 + pond.rows * (.5 + .24 * Math.sin(pond.time * .075)) * .35 }
    }
    let nearest = Infinity, pellet
    for (const p of pond.food) {
      const d = Math.hypot(p.x - fish.x, (p.y - fish.y) * pond.aspect)
      if (d < nearest) { nearest = d; target = p; pellet = p }
    }
    let hx = target.x - fish.x, hy = (target.y - fish.y) * pond.aspect
    const toward = Math.hypot(hx, hy) || 1
    hx /= toward; hy /= toward
    if (!pellet && behavior === 'school') { hx += headingX * 1.4; hy += headingY * 1.4 }
    if (!pellet && behavior === 'wander') {
      const ax = (fish.x - pond.columns / 2) / (pond.columns * .2), ay = (fish.y - pond.rows / 2) / (pond.rows * .18)
      const distance = Math.hypot(ax, ay) || .001
      if (distance < 1.3) { const push = (1.3 - distance) * 1.5; hx += ax / distance * push; hy += ay / distance * push }
    }
    for (const other of pond.fish) if (other !== fish) {
      const dx = fish.x - other.x, dy = (fish.y - other.y) * pond.aspect, d = Math.hypot(dx, dy)
      const safe = (fishLength(pond, fish) + fishLength(pond, other)) * .25
      if (d > .01 && d < safe) { const push = (1 - d / safe) * (pellet ? .35 : 1.1); hx += dx / d * push; hy += dy / d * push }
    }
    const length = fishLength(pond, fish), edge = length * .7
    // A reachable pellet near a bank takes precedence over the usual cruising margin.
    const bankPush = pellet ? clamp(nearest / (length * 1.5), 0, 1) : 1
    if (fish.x < edge) hx += (edge - fish.x) / edge * 2.5 * bankPush
    if (fish.x > pond.columns - edge) hx -= (fish.x - pond.columns + edge) / edge * 2.5 * bankPush
    const edgeY = edge / pond.aspect
    if (fish.y < edgeY) hy += (edgeY - fish.y) / edgeY * 2.5 * bankPush
    if (fish.y > pond.rows - edgeY) hy -= (fish.y - pond.rows + edgeY) / edgeY * 2.5 * bankPush
    const error = wrap(Math.atan2(hy, hx) - fish.angle)
    const desiredTurn = clamp(error * (pellet ? 2 : 1.5), pellet ? -1.5 : -.8, pellet ? 1.5 : .8)
    fish.turnVelocity += clamp((desiredTurn - fish.turnVelocity) * (1 - Math.exp(-dt * (pellet ? 3 : 3.5))), -5 * dt, 5 * dt)
    fish.angle = wrap(fish.angle + fish.turnVelocity * dt)
    const arrival = pellet ? clamp(nearest / (length * 1.2), .12, 1) * clamp((1 + Math.cos(error)) * .5, .12, 1) : 1
    const cruise = fish.speed * pond.columns / 100 * pond.options.speed
    const speedTarget = pellet ? Math.max(cruise * arrival, pond.columns * .001)
      : cruise * (.88 + .16 * Math.sin(pond.time * .6 + fish.phase))
    const effort = clamp(.12 + .28 * speedTarget / (cruise || 1) + .85 * Math.abs(speedTarget - fish.currentSpeed) / (cruise || 1)
      + .3 * Math.abs(fish.turnVelocity), .2, 1)
    fish.tailEffort += (effort - fish.tailEffort) * (1 - Math.exp(-dt * 3.5))
    fish.currentSpeed += (speedTarget - fish.currentSpeed) * (1 - Math.exp(-dt * (pellet ? 3.5 : 1.8)))
    const approach = pellet ? 1 - clamp(nearest / (pond.columns * .24), 0, 1) : 0
    const depthTarget = fishCruiseDepth(fish, pond.time) * (1 - approach) + .045 * approach
    fish.depth += (depthTarget - fish.depth) * (1 - Math.exp(-dt * (pellet ? 2.2 : .65)))
    fish.depth = clamp(fish.depth, 0, 1)
    fish.x = clamp(fish.x + Math.cos(fish.angle) * fish.currentSpeed * dt, .5, pond.columns - .5)
    fish.y = clamp(fish.y + Math.sin(fish.angle) * fish.currentSpeed * dt / pond.aspect, .5, pond.rows - .5)
    // Only a head at the pellet can eat it; distance is measured in aspect-corrected cells.
    if (pellet && Math.hypot(pellet.x - fish.x, (pellet.y - fish.y) * pond.aspect) < Math.max(.8, length * .075)) {
      pond.food.splice(pond.food.indexOf(pellet), 1); pond.eaten++
      disturb(pond, pellet.x, pellet.y, .7, 'bite')
    }
    fish.swimPhase += dt * (1.5 + fish.currentSpeed / pond.columns * 38)
    fishFollowSpine(pond, fish)
  }
}

function fishAnimatedSpine(pond, fish) {
  const length = fishLength(pond, fish)
  return fish.spine.map((p, i, nodes) => {
    const t = i / (FISH_JOINTS - 1), previous = nodes[Math.max(0, i - 1)], next = nodes[Math.min(FISH_JOINTS - 1, i + 1)]
    const dx = previous.x - next.x, dy = (previous.y - next.y) * pond.aspect, d = Math.hypot(dx, dy) || 1
    const wave = Math.sin(fish.swimPhase - t * 4.6) * length * (.022 + .029 * fish.tailEffort) * t ** 1.8
    return { x: p.x - dy / d * wave, y: p.y + dx / d * wave / pond.aspect }
  })
}

function fishDrawWake(pond, fish, frame, put) {
  const clarity = pond.options.waterClarity ?? .8
  const surface = (1 - fish.depth) * clamp(fish.currentSpeed / (fish.speed * pond.columns / 100 * pond.options.speed || 1), 0, 1.3)
  if (surface < .12) return
  const length = fishLength(pond, fish)
  for (let i = 0; i < 19; i++) {
    if (i % 3 === 1) continue
    const t = .45 + i * .05, joint = Math.min(FISH_JOINTS - 1, Math.round(t * (FISH_JOINTS - 1)))
    const node = fish.spine[joint], previous = fish.spine[Math.max(0, joint - 1)]
    const dx = node.x - previous.x, dy = (node.y - previous.y) * pond.aspect, distance = Math.hypot(dx, dy) || 1
    const extension = Math.max(0, t - 1) * length, spread = length * (.07 + (t - .45) * .13)
    const x = node.x + dx / distance * extension, y = node.y + dy / distance * extension / pond.aspect
    for (const side of [-1, 1]) {
      const px = Math.round(x - dy / distance * spread * side), py = Math.round(y + dx / distance * spread * side / pond.aspect)
      if (px < 0 || px >= frame.columns || py < 0 || py >= frame.rows) continue
      const pulse = .7 + .3 * Math.sin(fish.swimPhase - i * .65)
      put(px, py, i % 4 === 0 ? ',' : '.', 100 + (i % 3), Math.round((26 + 42 * clarity) * surface * pulse))
    }
  }
}

function fishDrawShadow(pond, fish, frame, mask) {
  const { columns, rows } = frame, { aspect } = pond
  const scale = fish.scale * pond.options.fishSize * columns / 112
  const clarity = pond.options.waterClarity ?? .8
  const depth = fish.depth
  const offsetX = (.65 + depth * 3.8) * scale
  const offsetY = (.45 + depth * 2.8) * scale / aspect
  const shade = (1.2 + depth * 3.4) * (.35 + clarity * .65)
  const radius = Math.max(.55, scale * 2.35)
  // Sparse capsules follow the articulated body, with the tail tapering out.
  for (let j = 0; j < FISH_JOINTS - 5; j++) {
    const a = fish.spine[j], b = fish.spine[j + 1]
    const taper = Math.sin((j + 1) / (FISH_JOINTS - 4) * Math.PI) ** .65
    const r = Math.max(.45, radius * taper)
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, (b.y - a.y) * aspect) / .85))
    for (let step = 0; step <= steps; step++) {
      const at = step / steps, cx = a.x + (b.x - a.x) * at + offsetX, cy = a.y + (b.y - a.y) * at + offsetY
      const x0 = Math.max(0, Math.ceil(cx - r)), x1 = Math.min(columns - 1, Math.floor(cx + r))
      const y0 = Math.max(0, Math.ceil(cy - r / aspect)), y1 = Math.min(rows - 1, Math.floor(cy + r / aspect))
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x - cx, (y - cy) * aspect) / r
        if (d <= 1) {
          const index = y * columns + x
          mask[index] = Math.max(mask[index], Math.round(shade * (1 - d * d)))
        }
      }
    }
  }
}

const fishShadowMasks = new WeakMap()
export function fishPaint(pond, frame, put) {
  const { columns: cols, rows, aspect } = pond
  let distances = new Float64Array(0), fractions = new Float64Array(0), closest = new Uint8Array(0)
  let shadow = fishShadowMasks.get(pond)
  if (!shadow || shadow.length !== cols * rows) { shadow = new Uint8Array(cols * rows); fishShadowMasks.set(pond, shadow) }
  shadow.fill(0)
  for (const fish of pond.fish) fishDrawShadow(pond, fish, frame, shadow)
  // Shade each cell once, so overlapping capsules do not accumulate hard black seams.
  for (let i = 0; i < shadow.length; i++) if (shadow[i]) {
    const background = frame.colors?.[i] || 98
    if (background < 91 || background > 106) continue
    put(i % cols, Math.floor(i / cols), ' ', 0, shadow[i] * 24)
  }
  for (const fish of pond.fish) fishDrawWake(pond, fish, frame, put)
  for (const fish of pond.fish.slice().sort((a, b) => b.depth - a.depth)) {
    const spine = fishAnimatedSpine(pond, fish), s = fish.scale * pond.options.fishSize * cols / 112
    const bodyCoverage = Math.round(244 - fish.depth * (8 + 65 * (1 - (pond.options.waterClarity ?? .8))))
    const segments = spine.slice(0, -1).map((a, j) => {
      const b = spine[j + 1], dx = b.x - a.x, dy = (b.y - a.y) * aspect
      return { x: a.x, y: a.y, dx, dy, inverseSquared: 1 / (dx * dx + dy * dy || 1), angle: Math.atan2(-dy, -dx) }
    })
    const xs = spine.map(p => p.x), ys = spine.map(p => p.y), margin = 6 * s
    const left = Math.max(0, Math.floor(Math.min(...xs) - margin)), right = Math.min(cols - 1, Math.ceil(Math.max(...xs) + margin))
    const top = Math.max(0, Math.floor(Math.min(...ys) - margin / aspect)), bottom = Math.min(rows - 1, Math.ceil(Math.max(...ys) + margin / aspect))
    const gridWidth = right - left + 1, cells = gridWidth * (bottom - top + 1)
    if (cells > distances.length) { distances = new Float64Array(cells); fractions = new Float64Array(cells); closest = new Uint8Array(cells) }
    distances.fill(Infinity, 0, cells)
    // Visit only the narrow strip around each joint rather than testing every joint for every pixel.
    for (let j = 0; j < segments.length; j++) {
      const a = segments[j], b = spine[j + 1], { dx, dy } = a
      const x0 = Math.max(left, Math.floor(Math.min(a.x, b.x) - margin)), x1 = Math.min(right, Math.ceil(Math.max(a.x, b.x) + margin))
      const y0 = Math.max(top, Math.floor(Math.min(a.y, b.y) - margin / aspect)), y1 = Math.min(bottom, Math.ceil(Math.max(a.y, b.y) + margin / aspect))
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x - a.x, py = (y - a.y) * aspect
        const at = clamp((px * dx + py * dy) * a.inverseSquared, 0, 1)
        const distance = (px - dx * at) ** 2 + (py - dy * at) ** 2, index = (y - top) * gridWidth + x - left
        if (distance < distances[index]) { distances[index] = distance; closest[index] = j; fractions[index] = at }
      }
    }
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const index = (y - top) * gridWidth + x - left, best = distances[index]
      if (best === Infinity) continue
      const j = closest[index], a = segments[j]
      let t = (j + fractions[index]) / (FISH_JOINTS - 1)
      const side = a.dx * (y - a.y) * aspect - a.dy * (x - a.x) >= 0 ? 1 : -1, angle = a.angle
      let lateral = Math.sqrt(best) * side
      // Beyond an endpoint, keep the tangent coordinate instead of wrapping a fin around it.
      if (t === 0 || t === 1) {
        const end = spine[t === 0 ? 0 : FISH_JOINTS - 1], near = spine[t === 0 ? 1 : FISH_JOINTS - 2]
        const dx = (t === 0 ? near.x - end.x : end.x - near.x), dy = (t === 0 ? near.y - end.y : end.y - near.y) * aspect
        const length = Math.hypot(dx, dy) || 1, px = x - end.x, py = (y - end.y) * aspect
        t += (px * dx + py * dy) / length / (25 * s)
        lateral = (dx * py - dy * px) / length
      }
      const u = 8 - t * 25, v = lateral / s, width = fishBodyWidth(u)
      if (u > -10 && u < 8 && Math.abs(v) <= width) {
        const nx = -(fishBodyHeight(u + .1, v) - fishBodyHeight(u - .1, v)) / .2
        const ny = -(fishBodyHeight(u, v + .1) - fishBodyHeight(u, v - .1)) / .2
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
        let family = fish.kind === 3 ? (patch ? 15 : 23) : patch || (fish.kind === 1 && u > 5) ? 23 : 15
        if (fish.variety === 'ogon') family = 31
        else if (fish.variety === 'sanke') {
          const ink = Math.sin(u * 1.05 - fish.phase) + Math.cos(v * 1.9 + u * .36) > 1.05 && u < 4.8
          if (ink) family = 39
        } else if (fish.variety === 'shusui') {
          family = Math.abs(v) < width * .57 && u < 5.4 ? 83 : Math.abs(v) > width * .72 && u < 3.8 ? 23 : 15
        }
        const eyeDistance = Math.hypot((u - 6.1) * .9, Math.abs(v) - 1.55), eye = eyeDistance < .31
        const gill = Math.abs(u - 4.1 + v * v * .11) < .19 && Math.abs(v) > .9
        const mouth = u > 7.3 && Math.abs(v) < .55
        if (gill) light *= .64
        const glyph = eye ? 'o' : mouth ? '=' : gill ? ')' : ridge ? '^' : scaleSeam ? (cross < .5 ? '(' : ')')
          : FISH_DENSITY[Math.floor(clamp(.15 + light * .8, 0, 1) * (FISH_DENSITY.length - 1))]
        put(x, y, glyph, eye || mouth ? 39 : family + Math.floor(light * (family === 39 ? 5 : 7)), eye ? 255 : bodyCoverage)
        if (eyeDistance >= .31 && eyeDistance < .49) put(x, y, '.', 15, 225)
      } else if (u > 5.7 && u < 7.5 && Math.abs(Math.abs(v) - (2.5 - (u - 5.7) * .65)) < .18) {
        put(x, y, v > 0 ? '/' : '\\', 15, 110)
      } else if (u > -2.8 && u < 4 && Math.abs(v) > 2.6) {
        const flutter = .91 + .09 * Math.sin(fish.swimPhase - .7)
        const edge = 3 + 2.5 * Math.sin((u + 2.8) / 6.8 * Math.PI) * flutter
        if (Math.abs(v) < edge) {
          const ray = Math.abs(Math.sin(Math.atan2(v, u - 4.5) * 26)), rim = edge - Math.abs(v) < .24
          const finFamily = fish.variety === 'ogon' ? 31 : fish.variety === 'shusui' ? 83 : 15
          put(x, y, rim ? '.' : ray > .78 ? '/' : ':', finFamily + Math.floor((.42 + ray * .48) * 7), rim ? 92 : 68 + Math.round(ray * 90))
        }
      } else if (u <= -9.5 && u >= -17) {
        const q = (-u - 9.5) / 7.5, fan = .48 + 3.8 * Math.sin(q * Math.PI * .56) ** 1.35
        if (Math.abs(v) < fan && q < .82 + .2 * Math.sin(Math.abs(v) / fan * Math.PI) && !(q > .67 && Math.abs(v) < (q - .67) * 3.5)) {
          const ray = Math.abs(Math.sin(v / fan * 22 + q * 1.7)), rim = fan - Math.abs(v) < .25
          const family = fish.variety === 'ogon' ? 31 : fish.variety === 'shusui' ? 83 : 39, count = family === 39 ? 5 : 7
          put(x, y, rim ? '.' : ray > .68 ? ';' : ':', family + Math.floor((.2 + ray * .57) * count), rim ? 125 : 165 + Math.round(ray * 60))
        }
      }
    }
  }
}

function fishBodyWidth(u) {
  if (u <= -10 || u >= 8) return 0
  return u >= 4 ? 3.15 * Math.sqrt(Math.max(0, 1 - ((u - 4) / 4) ** 2)) : .38 + 2.77 * Math.sin((u + 10) / 14 * Math.PI / 2) ** 1.5
}
function fishBodyHeight(u, v) {
  const width = fishBodyWidth(u)
  return width > 0 ? width * .55 * Math.sqrt(Math.max(0, 1 - (v / width) ** 2)) : 0
}
