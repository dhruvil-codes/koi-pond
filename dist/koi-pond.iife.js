/*! Koi Pond v0.4.1 | Copyright 2026 Dhruvil | MIT License */
(() => {
'use strict';
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
  ...ramp('713b52', 'f3c1cd', 12), ...ramp('dca7b1', 'fff0df', 6), ...ramp('8e5d28', 'f2cc73', 6), ...ramp('406b87', 'b9dfeb', 8)]

const VARIETIES = Object.freeze(['kohaku', 'sanke', 'ogon', 'shusui'])
const DEFAULT_OPTIONS = Object.freeze({ environment: 'zen', fishCount: 12, speed: 1.35, fishSize: 1, varieties: VARIETIES, behavior: 'wander', waterColor: null, waterClarity: .8, causticIntensity: .65, lilyDensity: .7, lotusCount: 2, particleDensity: .45, rippleIntensity: 1, timeOfDay: 'auto', seed: 2026, lilies: true, lotus: true, detail: 'fine', paused: false, interactive: true })
const optionKeys = new Set(Object.keys(DEFAULT_OPTIONS))
const configEnvironments = ['zen', 'moonlight', 'autumn', 'sakura', 'daylight', 'midnight', 'rain', 'dusk']

function validateOptions(partial = {}, current = DEFAULT_OPTIONS) {
  if (!partial || typeof partial !== 'object' || Array.isArray(partial)) throw new TypeError('Options must be an object')
  if (!current || typeof current !== 'object' || Array.isArray(current)) throw new TypeError('Current options must be an object')
  for (const key of Object.keys(current)) if (!optionKeys.has(key)) throw new TypeError(`Unknown option: ${key}`)
  for (const key of Object.keys(partial)) if (!optionKeys.has(key)) throw new TypeError(`Unknown option: ${key}`)
  const next = { ...DEFAULT_OPTIONS, ...current, ...partial }
  if (!configEnvironments.includes(next.environment)) throw new RangeError('Unknown environment')
  const range = (key, low, high, integer = false) => {
    if (!Number.isFinite(next[key]) || next[key] < low || next[key] > high || (integer && !Number.isInteger(next[key]))) throw new RangeError(`${key} must be ${integer ? 'an integer' : 'a finite number'} from ${low} to ${high}`)
  }
  range('fishCount', 1, 30, true); range('speed', .1, 3); range('fishSize', .5, 1.8)
  range('waterClarity', 0, 1); range('causticIntensity', 0, 1)
  range('lilyDensity', 0, 1); range('lotusCount', 0, 6, true); range('particleDensity', 0, 1); range('rippleIntensity', 0, 2); range('seed', 0, 4294967295, true)
  if (!Array.isArray(next.varieties) || !next.varieties.length || next.varieties.some(id => !VARIETIES.includes(id)) || new Set(next.varieties).size !== next.varieties.length) throw new TypeError('Choose one or more unique fish varieties')
  next.varieties = [...next.varieties]
  if (!['wander', 'school', 'circle'].includes(next.behavior)) throw new RangeError('behavior must be wander, school, or circle')
  if (next.waterColor !== null && (typeof next.waterColor !== 'string' || !/^#[\da-f]{6}$/i.test(next.waterColor))) throw new TypeError('waterColor must be null or a six-digit hex color')
  if (next.waterColor) next.waterColor = next.waterColor.toLowerCase()
  if (next.timeOfDay !== 'auto') range('timeOfDay', 0, 24)
  for (const key of ['lilies', 'lotus', 'paused', 'interactive']) if (typeof next[key] !== 'boolean') throw new TypeError(`${key} must be a boolean`)
  if (!['fine', 'balanced'].includes(next.detail)) throw new RangeError('detail must be fine or balanced')
  return next
}

function serializeConfig(options = {}) {
  return JSON.stringify({ version: 1, options: validateOptions(options) })
}

function parseConfig(input) {
  if (typeof input !== 'string' || input.length > 10000) throw new TypeError('Configuration must be a JSON string under 10 KB')
  let value
  try { value = JSON.parse(input) } catch { throw new TypeError('Configuration is not valid JSON') }
  if (value && typeof value === 'object' && 'version' in value) {
    if (value.version !== 1 || Object.keys(value).some(key => !['version', 'options'].includes(key)) || !value.options) throw new RangeError('Unsupported configuration format')
    value = value.options
  }
  return validateOptions(value)
}

function randomizeConfig(seed = Math.floor(Math.random() * 4294967296)) {
  validateOptions({ seed })
  let state = seed >>> 0
  const next = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
  const choose = values => values[Math.floor(next() * values.length)]
  const round = n => Math.round(n * 100) / 100
  const varieties = VARIETIES.filter(() => next() > .25)
  return validateOptions({ environment: choose(configEnvironments.slice(0, 5)), fishCount: 6 + Math.floor(next() * 15), speed: round(.5 + next() * 1.4), fishSize: round(.75 + next() * .55), varieties: varieties.length ? varieties : ['kohaku'], behavior: choose(['wander', 'school', 'circle']), lilyDensity: round(.25 + next() * .65), lotusCount: 1 + Math.floor(next() * 4), particleDensity: round(.2 + next() * .6), rippleIntensity: round(.5 + next()), waterClarity: round(.55 + next() * .45), causticIntensity: round(.2 + next() * .7), seed })
}


const ENVIRONMENTS = Object.freeze([
  { id: 'zen', label: 'Zen Garden', description: 'Jade water, mossy granite and quiet pink blossoms' },
  { id: 'moonlight', label: 'Moonlight', description: 'Blue water, broken moonlight and drifting fireflies' },
  { id: 'autumn', label: 'Autumn', description: 'Charcoal water, amber light and falling maple leaves' },
  { id: 'sakura', label: 'Sakura Spring', description: 'Violet water and a canopy of flowering cherry' },
  { id: 'daylight', label: 'Daylight', description: 'Turquoise water, golden sunlight and lush summer leaves' },
].map(envEntry => Object.freeze(envEntry)))

const envSceneColors = {
  zen: ['001e1c', '186e5c', '17282a', '8b9690', '273b17', '91a13c', '241f1b', '715343', '924455', 'ffbbcb', '933f19', 'f5a735', '195b50', '72b8a2', '3d501b', 'a7aa46'],
  moonlight: ['001020', '0d4563', '172532', '7d8b9c', '243a28', '6d8648', '182331', '4c4c62', '753c68', 'f0a2ce', '79532e', 'd8ab69', '174a6c', 'e3f7f0', '2b4931', '81965a'],
  autumn: ['151e20', '4b4b38', '292b2c', 'a29a7e', '424019', 'a8a446', '291c16', '7a4125', 'a3481d', 'ffb758', '9e2711', 'ff9d22', '68421f', 'fbc783', '564823', 'c4a34b'],
  sakura: ['151d31', '55455f', '2c2c3a', 'a397b4', '303c28', '8a9b55', '282032', '75566c', 'a14f7e', 'ffc1d8', 'ad5373', 'f5aec9', '67405e', 'ffc4d5', '41432d', 'b1a168'],
  daylight: ['176f7e', '81d8c8', '394e50', 'a5ac9b', '33653b', 'b1d978', '3d4640', '9b7c55', 'a6425d', 'ffd2bf', '5b492d', 'e8c16d', '6fbac5', 'fff4ba', '4b6030', 'c7cf70'],
}

const envLeafColors = {
  zen: ['174b38', 'a3bc71'], moonlight: ['183e3d', '6a9c87'],
  autumn: ['3f452b', 'b9b676'], sakura: ['354934', 'aebc82'], daylight: ['28674c', 'cee598'],
}

function resolveEnvironment(id) {
  return ({ midnight: 'moonlight', rain: 'zen', dusk: 'autumn' })[id] || id
}

const envMix = (envA, envB, envT) => '#' + [0, 2, 4].map(envChannel => Math.round(parseInt(envA.slice(envChannel, envChannel + 2), 16) * (1 - envT) + parseInt(envB.slice(envChannel, envChannel + 2), 16) * envT).toString(16).padStart(2, '0')).join('')

function paletteForEnvironment(id, basePalette, options = {}) {
  const envId = resolveEnvironment(id), envColors = envSceneColors[envId]
  if (!envColors) throw new RangeError(`Unknown environment: ${id}`)
  const envPalette = basePalette.slice(0, 91)
  while (envPalette.length < 91) envPalette.push('#000000')
  const envHour = options.timeOfDay === 'auto' || options.timeOfDay == null ? null : options.timeOfDay
  const envDaylight = envHour === null ? 1 : .48 + .52 * Math.max(0, Math.sin((envHour - 6) / 12 * Math.PI))
  const envWater = options.waterColor ? options.waterColor.slice(1) : envColors[0]
  const envWaterLight = options.waterColor ? envMix(envWater, envColors[1], .45).slice(1) : envColors[1]
  const envLight = envColor => envMix('030711', envColor.replace('#', ''), envDaylight)
  const envWaterRamp = ramp(envWater, envWaterLight, 16).map(envLight)
  envPalette[0] = envWaterRamp[0]
  for (let envI = 1; envI < 15; envI++) envPalette[envI] = envWaterRamp[Math.min(15, envI + 1)]
  envPalette.push(...envWaterRamp)
  // Scenery has its own ramps, leaving every koi shade untouched.
  for (const [envStart, envEnd, envCount] of [[2, 3, 12], [4, 5, 12], [6, 7, 8], [8, 9, 12], [10, 11, 12], [12, 13, 12], [14, 15, 10]]) {
    envPalette.push(...ramp(envColors[envStart], envColors[envEnd], envCount).map(envLight))
  }
  envPalette.push(...ramp(envId === 'daylight' ? 'a98336' : '59622b', envId === 'daylight' ? 'fff3bb' : 'fff6a1', 6).map(envLight))
  const envLeaves = ramp(...envLeafColors[envId], 12)
  for (let envI = 0; envI < 12; envI++) envPalette[45 + envI] = envLeaves[envI]
  if (envId !== 'zen' || envHour !== null) {
    const envPlantTint = envId === 'moonlight' ? '23405a' : envId === 'autumn' ? '9a732d' : envId === 'sakura' ? '50526c' : envId === 'daylight' ? '8e9f49' : '244237'
    for (let envI = 45; envI <= 82; envI++) envPalette[envI] = envLight(envMix(envPalette[envI].slice(1), envPlantTint, envId === 'moonlight' ? .22 : .12))
  }
  return envPalette
}


const envDewdrops = [[-.31, -.24, .068], [.23, .39, .045]]

function envDrawLilyPads(pond, pads, put, shadows = false) {
  const { columns, rows, aspect } = pond
  for (const pad of pads) {
    const r = pad.radius * (shadows ? 1.08 : 1), cx = pad.x + (shadows ? r * .06 : 0), cy = pad.y + (shadows ? r * .11 / aspect : 0)
    for (let y = Math.max(0, Math.floor(cy - r / aspect - 1)); y <= Math.min(rows - 1, Math.ceil(cy + r / aspect + 1)); y++) {
      for (let x = Math.max(0, Math.floor(cx - r - 1)); x <= Math.min(columns - 1, Math.ceil(cx + r + 1)); x++) {
        const dx = (x - cx) / r, dy = (y - cy) * aspect / r
        const u = dx * pad.cos + dy * pad.sin, v = (-dx * pad.sin + dy * pad.cos) / pad.flatten
        const radius = Math.hypot(u, v), angle = Math.atan2(v, u)
        const edge = 1 + .022 * Math.sin(angle * 5 + pad.phase) + .012 * Math.sin(angle * 11 - pad.phase)
        // The open V reaches the leaf's centre, with a slightly rolled inner lip.
        const notch = u > -.09 && Math.abs(v) < (u + .09) * .27
        if (radius > edge || notch) continue
        if (shadows) { put(x, y, ' ', 0, Math.round(100 * clamp((edge - radius) / .18, 0, 1))); continue }
        const rim = radius > edge - .07
        const veinAngle = Math.atan2(v, u + .13), veinRadius = Math.hypot(u + .13, v)
        const vein = radius > .14 ? clamp(1 - Math.abs(Math.sin(veinAngle * 7)) * veinRadius / .075, 0, 1) : 0
        const mainVein = vein > .32
        const branchVein = radius > .4 && Math.abs(Math.sin(veinAngle * 14 + radius * 13)) < .1
        const growth = Math.sin((radius + .016 * Math.sin(angle * 9)) * 36 + pad.phase)
        const innerLip = u > -.09 && Math.abs(Math.abs(v) - (u + .09) * .27) < .045
        let light = .5 - dx * .19 - dy * .23 + .022 * growth + .012 * Math.sin(u * 31 + v * 21 + pad.phase)
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

function envPondBed(pond, put, seed, clarity) {
  if (clarity === 0) return
  const { columns, rows, aspect } = pond
  // Small clusters leave the centre open; low-contrast material keeps them submerged.
  for (let i = 0; i < 74; i++) {
    const bank = i % 3, n = hash(i + seed, 531), m = hash(i + seed, 532)
    const cx = columns * (bank === 0 ? .015 + n * .19 : bank === 1 ? .79 + n * .2 : .12 + n * .77)
    const cy = rows * (bank === 0 ? .28 + m * .24 : bank === 1 ? .8 + m * .19 : .91 + m * .09)
    const radius = Math.max(.8, columns * (.0022 + hash(i + seed, 533) * .006))
    for (let y = Math.floor(cy - radius / aspect); y <= Math.ceil(cy + radius / aspect); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const u = (x - cx) / radius, v = (y - cy) * aspect / radius
        if (u * u + v * v > 1) continue
        const light = clamp(.42 - u * .19 - v * .24 + n * .12, 0, 1)
        put(x, y, n > .6 ? ':' : '.', 93 + Math.floor(light * 7), Math.round(110 + clarity * 75))
      }
    }
  }
  for (let i = 0; i < 18; i++) {
    const n = hash(i + seed, 812), cx = columns * (i % 2 ? .91 + n * .08 : .015 + n * .065)
    const cy = rows * (.47 + hash(i + seed, 813) * .44), length = columns * (.018 + n * .025)
    for (let blade = -1; blade <= 1; blade++) {
      for (let s = 0; s < length; s += .7) {
        const t = s / length, x = cx + blade * length * .23 * t + Math.sin(t * 2.7 + n * 6) * length * .12
        put(x, cy - s / aspect, blade < 0 ? '\\' : '/', 94 + Math.floor(t * 6), Math.round((95 + t * 65) * clarity))
      }
    }
  }
}

function envSmoothNoise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = hash(ix + seed, iy), b = hash(ix + seed + 1, iy), c = hash(ix + seed, iy + 1), d = hash(ix + seed + 1, iy + 1)
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v
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
  const backPut = paint(back), frontPut = paint(front), shimmer = [], causticMask = new Float32Array(total)
  const shadeWater = (x, y, glyph, color, coverage) => {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || x >= columns || y < 0 || y >= rows) return
    const index = y * columns + x
    back.coverage[index] = Math.round(back.coverage[index] * (1 - coverage / 255))
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const nx = x / columns, ny = y / rows, worldY = y * aspect / columns
      const depth = envSmoothNoise(nx * 4.2, worldY * 4.2, seed % 65536)
      const glow = Math.exp(-((nx - .67) ** 2 / .19 + (ny - .16) ** 2 / .48))
      const basin = Math.exp(-((nx - .42) ** 2 / .15 + (ny - .57) ** 2 / .26))
      const light = .32 + depth * .1 + glow * .28 - basin * .2
      // A single hue with gradual coverage avoids palette bands and checkerboard grain.
      backPut(x, y, ' ', 106, Math.round(35 + light * 210))
      causticMask[y * columns + x] = clamp((envSmoothNoise(nx * 6 + 13, worldY * 6 + 7, seed % 8192) - .38) * 2, 0, 1) * (1 - basin * .65)
      if (fine && x % 5 === 0 && y % 4 === 0 && hash(x + seed, y) > .85) shimmer.push([x, y, x * .027 + y * .09])
    }
  }
  envPondBed(pond, (x, y, glyph, color) => {
    const clarity = options.waterClarity ?? .8
    shadeWater(x, y, ' ', 0, Math.max(.08, (101 - color) / 20) * clarity * 178)
  }, seed, options.waterClarity ?? .8)
  // Submerged bank shadows sit beneath the rock geometry and remain out of the fish layer.
  for (const [cx, cy, rx, ry] of [[-.01, .44, .10, .10], [.96, 1.01, .21, .19]]) {
    for (let y = Math.max(0, Math.floor((cy - ry) * rows)); y < Math.min(rows, Math.ceil((cy + ry) * rows)); y++) for (let x = Math.max(0, Math.floor((cx - rx) * columns)); x < Math.min(columns, Math.ceil((cx + rx) * columns)); x++) {
      const d = Math.hypot((x / columns - cx) / rx, (y / rows - cy) / ry)
      if (d < 1) shadeWater(x, y, ' ', 0, 125 * (1 - d) ** 2)
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
  envDrawLilyPads(pond, pads, shadeWater, true)
  envDrawLilyPads(pond, pads, frontPut)
  const flowerCount = options.lotus === false ? 0 : options.lotusCount ?? 2
  // Static painter time avoids rebuilding thousands of petal cells for sub-cell movement.
  const still = { columns, rows, aspect, time: 0 }
  for (let i = 0; i < flowerCount; i++) envDrawLotus(still, frontPut, envFlowerLayout[i])
  const frontCells = []
  for (let i = 0; i < total; i++) if (front.coverage[i] || front.chars[i] !== 32) frontCells.push(i)
  const causticX = Array.from({ length: columns }, (_, x) => {
    const phase = x / columns * 64, bend = Math.sin(x / columns * 35 + seed % 13)
    return [Math.sin(phase), Math.cos(phase), Math.sin(bend), Math.cos(bend)]
  })
  return { key, back, front, frontCells, shimmer, causticX, causticMask }
}

function envGet(pond) {
  const options = pond.options || {}
  const key = [pond.columns, pond.rows, pond.aspect, resolveEnvironment(options.environment || 'zen'), options.seed ?? 2026, options.detail, options.waterClarity ?? .8, options.lilies, options.lilyDensity ?? .7, options.lotus, options.lotusCount ?? 2].join('|')
  let cached = envCache.get(pond)
  if (!cached || cached.key !== key) { cached = envBuild(pond, key); envCache.set(pond, cached) }
  return cached
}

function envRing(pond, put, cx, cy, radius, color, strength = 1) {
  if (radius < .2 || strength < .005) return
  const segments = Math.max(12, Math.ceil(radius * Math.PI * 2 / .85))
  for (let i = 0; i < segments; i++) {
    const angle = i / segments * Math.PI * 2
    if (hash(Math.floor(angle * 16), 721) < .08) continue
    put(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius / pond.aspect, Math.abs(Math.sin(angle)) > .7 ? '-' : '.', color, Math.round(clamp(strength, 0, 1) * 190))
  }
}

function envCaustics(pond, cached, put, scene) {
  const { columns, rows, time, options } = pond
  const intensity = options.causticIntensity ?? .65, clarity = options.waterClarity ?? .8
  if (!intensity || !clarity) return
  const light = options.timeOfDay === 'auto' ? (scene === 'moonlight' ? .28 : scene === 'daylight' ? 1 : .65)
    : .2 + .8 * Math.max(0, Math.sin((options.timeOfDay - 6) / 12 * Math.PI))
  const strength = intensity * clarity * light
  const step = options.detail === 'balanced' ? 2 : 1, flow = time * .23
  for (let y = 0; y < rows; y += step) {
    const py = y / rows * 36, wave = Math.sin(py * .7 + flow) * 1.4
    const sinWave = Math.sin(wave + flow * .4), cosWave = Math.cos(wave + flow * .4)
    const sinY = Math.sin(py - flow * .7), cosY = Math.cos(py - flow * .7)
    for (let x = 0; x < columns; x += step) {
      const phases = cached.causticX[x]
      const field = phases[0] * cosWave + phases[1] * sinWave + sinY * phases[3] + cosY * phases[2]
      const edge = Math.max(0, 1 - Math.abs(field - .35) / .13)
      if (edge < .14) continue
      const brightness = edge * edge * strength * cached.causticMask[y * columns + x]
      if (brightness < .018) continue
      put(x, y, brightness > .4 ? '-' : '.', 106, Math.round(brightness * 160))
    }
  }
}

function envReflection(pond, put, scene) {
  if (scene === 'zen') return
  const { columns: cols, rows, time } = pond, sunny = scene === 'daylight'
  const center = scene === 'autumn' ? .57 : sunny ? .68 : .615, reach = sunny ? .76 : .6
  for (let y = 0; y < rows * reach; y++) {
    const t = y / (rows * reach), py = y / rows
    const band = clamp(.3 + .5 * Math.sin(py * 184 - time * .42) + .25 * Math.sin(py * 421 + time * .17), 0, 1)
    const drift = Math.sin(y / rows * 24 + time * .19) * cols * (.004 + t * .009)
    const width = cols * (sunny ? .027 + t * .065 : .026 + t * .038)
    const x = cols * (center - (sunny ? t * .08 : 0)) + drift
    for (let dx = -width; dx <= width; dx++) {
      const edge = Math.max(0, 1 - Math.abs(dx / width)) ** 1.2
      const texture = .72 + .28 * Math.sin(dx * .72 + py * 138 + time * .12)
      const brightness = band * edge * texture * (1 - t) ** 1.4
      const coverage = Math.round(brightness * (scene === 'moonlight' ? 130 : sunny ? 100 : 85))
      if (coverage < 3) continue
      put(x + dx, y, coverage > 25 ? '-' : ' ', 163 + Math.floor((.3 + brightness * .69) * 11), coverage)
    }
  }
}

function paintEnvironmentBack(pond, frame, put) {
  const cached = envGet(pond), time = pond.time || 0, options = pond.options || {}, scene = resolveEnvironment(options.environment || 'zen')
  frame.background = cached.back
  frame.chars.set(cached.back.chars); frame.colors.set(cached.back.colors); frame.coverage.set(cached.back.coverage)
  envCaustics(pond, cached, put, scene)
  const intensity = options.rippleIntensity ?? 1
  if (intensity > 0) {
    for (const [x, y, phase] of cached.shimmer) {
      const light = Math.sin(time * .24 + phase)
      if (light > .985) put(x, y, '.', 106, Math.round((light - .985) / .015 * 32 * intensity))
    }
  }
  envReflection(pond, put, scene)
}

function paintEnvironmentSurface(pond, frame, put) {
  const intensity = pond.options.rippleIntensity ?? 1
  if (!intensity) return
  // Ambient droplets are spaced far apart so the water never becomes a target pattern.
  for (let i = 0; i < 2; i++) {
    const age = (pond.time + i * 7.3) % 17
    if (age > 3.8) continue
    const cycle = Math.floor((pond.time + i * 7.3) / 17), seed = pond.options.seed ?? 2026
    const x = pond.columns * (.2 + hash(cycle + seed, i + 864) * .62), y = pond.rows * (.25 + hash(cycle + seed, i + 865) * .55)
    envRing(pond, put, x, y, (age + .1) * pond.columns * .026, 102, .22 * intensity * (1 - age / 3.8))
  }
  for (const ripple of pond.ripples) {
    const bite = ripple.kind === 'bite', age = ripple.age, life = bite ? 1.4 : 4.5
    if (age >= life) continue
    const fade = (1 - age / life) ** 1.7, strength = (ripple.strength ?? 1) * intensity * fade
    const radius = Math.max(.8, age * pond.columns * (bite ? .027 : .078))
    envRing(pond, put, ripple.x, ripple.y, radius, 104, strength)
    if (age > .16 && !bite) envRing(pond, put, ripple.x, ripple.y, radius * .71, 101, strength * .45)
    if (age < .65) {
      for (let i = 0; i < (bite ? 5 : 3); i++) {
        const angle = i * 2.4 + .6, distance = (.4 + age * (bite ? 5 : 3)) * pond.columns / 280
        put(ripple.x + Math.cos(angle) * distance, ripple.y + Math.sin(angle) * distance / pond.aspect,
          bite ? 'o' : '.', bite ? 22 : 106, Math.round((1 - age / .65) * strength * 235))
      }
    }
  }
}

function paintEnvironmentFront(pond, frame, put) {
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

function fishCreate(pond, index) {
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

function fishInitialize(pond, fish) {
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

const fishLength = (pond, fish) => 25 * fish.scale * pond.options.fishSize * pond.columns / 112

function fishCruiseDepth(fish, time) {
  return clamp(.46 + .24 * Math.sin(time * .16 + fish.phase * 1.37)
    + .08 * Math.sin(time * .073 + fish.phase * 2.11), .12, .82)
}

function fishFollowSpine(pond, fish) {
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

function fishAdvance(pond, dt, disturb) {
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
function fishPaint(pond, frame, put) {
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



function createPond(columns = 120, rows = 44, aspect = 1.6, options = {}) {
  const normalizedOptions = validateOptions(options)
  const pond = { columns, rows, aspect, time: 0, paused: normalizedOptions.paused, options: normalizedOptions, eaten: 0, ripples: [], food: [], fish: [] }
  while (pond.fish.length < normalizedOptions.fishCount) {
    const fish = fishCreate(pond, pond.fish.length)
    fishInitialize(pond, fish)
    pond.fish.push(fish)
  }
  return pond
}

function configurePond(pond, partial) {
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

function resizePond(pond, columns, rows) {
  const sx = columns / pond.columns, sy = rows / pond.rows
  for (const p of [...pond.fish, ...pond.ripples, ...pond.food]) { p.x *= sx; p.y *= sy }
  for (const fish of pond.fish) {
    fish.currentSpeed *= sx
    for (const node of fish.spine) { node.x *= sx; node.y *= sy }
  }
  pond.columns = columns; pond.rows = rows
  for (const fish of pond.fish) fishFollowSpine(pond, fish)
}

function disturb(pond, x, y, strength = 1, kind = 'touch') {
  pond.ripples.push({ x: clamp(x, 0, pond.columns - 1), y: clamp(y, 0, pond.rows - 1), age: 0, strength, kind })
  if (pond.ripples.length > 10) pond.ripples.shift()
}

function feed(pond, x, y) {
  const margin = Math.min(3, pond.columns / 5, pond.rows / 5)
  pond.food.push({ x: clamp(x, margin, pond.columns - margin), y: clamp(y, margin, pond.rows - margin), age: 0 })
  if (pond.food.length > 8) pond.food.shift()
  disturb(pond, x, y, 1)
}

function advance(pond, delta) {
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

function renderPond(pond) {
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
  paintEnvironmentSurface(pond, frame, put)
  paintEnvironmentFront(pond, frame, put)
  // Food floats above the foreground pads and reeds. Keep its footprint visible
  // at small grids, while scaling gently with the larger detailed canvases.
  const radius = clamp(columns * .014, 2.1, 4)
  for (const pellet of pond.food) {
    const left = Math.floor(pellet.x - radius), right = Math.ceil(pellet.x + radius)
    const top = Math.floor(pellet.y - radius / pond.aspect), bottom = Math.ceil(pellet.y + radius / pond.aspect)
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const distance = Math.hypot(x - pellet.x, (y - pellet.y) * pond.aspect)
      if (distance > radius) continue
      const center = distance < radius * .46
      put(x, y, center ? '@' : distance < radius * .76 ? 'o' : '*', center ? 22 : 37, center ? 255 : 230)
    }
  }
  return frame
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
  const backgroundCanvas = doc.createElement('canvas'), backgroundContext = backgroundCanvas.getContext('2d', { alpha: false })
  if (!backgroundContext) throw new Error('A 2D canvas context is required for the pond background')
  const media = win.matchMedia('(prefers-reduced-motion: reduce)')
  const listeners = new win.AbortController()
  let pond = createPond(120, 44, 1.6, { ...settings, paused: settings.paused || media.matches })
  let destroyed = false, raf = 0, previous = 0, inView = true, width = 0, height = 0, cellX = 3, cellY = 4.8
  let down, keyboardCursor, lastPoint, lastStir = -Infinity, palette, fromPalette, paletteTime = 0
  let paintedFrame, paintedCursor = false, frameBudget = 1000 / 60, slowFrames = 0
  let columnEdges, rowEdges, pixelRatio = 1, rasterBackground, rasterPalette
  const saved = Object.fromEntries(['tabindex', 'role', 'aria-label'].map(key => [key, canvas.getAttribute(key)]))
  const originalTouchAction = canvas.style.touchAction
  const originalCursor = canvas.style.cursor
  canvas.style.touchAction = originalTouchAction === 'none' ? 'none' : 'pan-y'

  const alive = () => { if (destroyed) throw new Error('This pond has been destroyed') }
  const config = () => Object.freeze({ ...pond.options, varieties: Object.freeze([...pond.options.varieties]), paused: pond.paused })
  const state = () => Object.freeze({ ...config(), foodCount: pond.food.length, eaten: pond.eaten, destroyed })
  const announce = () => {
    canvas.tabIndex = pond.options.interactive ? 0 : -1
    canvas.style.cursor = pond.options.interactive ? 'crosshair' : 'default'
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('aria-label', `ASCII pond with ${pond.fish.length} koi${pond.options.lilies ? ', lily pads' : ''}${pond.options.lotus ? ' and a lotus' : ''}. ${pond.paused ? 'Paused.' : 'Swimming.'} ${pond.options.interactive ? 'Move or drag to stir, click to feed. Arrow keys move a cursor, Enter feeds, Space pauses, R resets.' : ''}`)
    canvas.dispatchEvent(new win.CustomEvent('pondchange', { detail: state(), bubbles: true, composed: true }))
  }
  const mixPalette = (next, now) => {
    if (!fromPalette || pond.paused || media.matches) { fromPalette = undefined; return next }
    const t = bounded((now - paletteTime) / 280), ease = 1 - (1 - t) ** 3
    if (t === 1) { fromPalette = undefined; return next }
    return next.map((color, i) => {
      const old = fromPalette[i] || color
      return '#' + [1, 3, 5].map(c => Math.round(parseInt(old.slice(c, c + 2), 16) * (1 - ease) + parseInt(color.slice(c, c + 2), 16) * ease).toString(16).padStart(2, '0')).join('')
    })
  }
  const paintCell = (context, frame, i, x, y) => {
    if (frame.chars[i] === 32 && !frame.coverage[i]) return
    const left = columnEdges[x], top = rowEdges[y], cellWidth = columnEdges[x + 1] - left, cellHeight = rowEdges[y + 1] - top
    const water = frame.colors[i] >= 91 && frame.colors[i] <= 106
    context.fillStyle = palette[frame.colors[i]]
    if (frame.coverage[i]) {
      context.globalAlpha = frame.coverage[i] / 255
      const inset = water ? 0 : .1
      context.fillRect(left + inset, top + inset, cellWidth - inset * 2, cellHeight - inset * 2)
      context.globalAlpha = 1
    }
    if (frame.coverage[i] > 128) context.fillStyle = frame.colors[i] >= 91 ? 'rgba(0,0,0,.16)' : frame.colors[i] >= 83 ? 'rgba(12,35,44,.3)' : frame.colors[i] >= 59 ? 'rgba(74,27,48,.3)' : frame.colors[i] >= 45 ? 'rgba(5,22,12,.4)' : 'rgba(55,47,35,.28)'
    if (frame.chars[i] !== 32) {
      context.globalAlpha = frame.coverage[i] <= 128 ? frame.coverage[i] / 128 : 1
      context.fillText(String.fromCharCode(frame.chars[i]), (x + .5) * cellX, (y + .5) * cellY)
      context.globalAlpha = 1
    }
  }
  const paint = (now = win.performance.now()) => {
    if (destroyed || !width || !height) return
    const frame = renderPond(pond), background = frame.background
    palette = mixPalette(frame.palette, now)
    const rasterChanged = rasterBackground !== background || !rasterPalette || palette.some((color, i) => color !== rasterPalette[i])
    if (rasterChanged) {
      backgroundCanvas.width = canvas.width; backgroundCanvas.height = canvas.height
      backgroundContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      backgroundContext.font = ctx.font
      backgroundContext.textAlign = 'center'; backgroundContext.textBaseline = 'middle'
      backgroundContext.fillStyle = palette[0]; backgroundContext.fillRect(0, 0, width, height)
      for (let y = 0; y < frame.rows; y++) for (let x = 0; x < frame.columns; x++) paintCell(backgroundContext, background, y * frame.columns + x, x, y)
      rasterBackground = background; rasterPalette = palette
    }
    const full = !paintedFrame || rasterChanged || keyboardCursor || paintedCursor
    if (full) ctx.drawImage(backgroundCanvas, 0, 0, width, height)
    const changed = i => full || frame.chars[i] !== paintedFrame.chars[i] || frame.colors[i] !== paintedFrame.colors[i] || frame.coverage[i] !== paintedFrame.coverage[i]
    for (let y = 0; y < frame.rows; y++) {
      let x = 0
      while (x < frame.columns) {
        if (!changed(y * frame.columns + x)) { x++; continue }
        const start = x++
        while (x < frame.columns && changed(y * frame.columns + x)) x++
        // Restore adjacent cells in one copy, before painting their translucent materials.
        if (!full) {
          const left = columnEdges[start], top = rowEdges[y], spanWidth = columnEdges[x] - left, cellHeight = rowEdges[y + 1] - top
          ctx.drawImage(backgroundCanvas, left * pixelRatio, top * pixelRatio, spanWidth * pixelRatio, cellHeight * pixelRatio, left, top, spanWidth, cellHeight)
        }
        for (let column = start; column < x; column++) {
          const i = y * frame.columns + column
          if (frame.chars[i] === background.chars[i] && frame.colors[i] === background.colors[i] && frame.coverage[i] === background.coverage[i]) continue
          paintCell(ctx, frame, i, column, y)
        }
      }
    }
    paintedFrame = frame; paintedCursor = Boolean(keyboardCursor)
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
    if (now - previous >= frameBudget - 1) {
      const started = win.performance.now()
      const eaten = pond.eaten, foodCount = pond.food.length
      advance(pond, Math.min((now - previous) / 1000, .1)); previous = now
      paint(now)
      if (pond.eaten !== eaten || pond.food.length !== foodCount) announce()
      const elapsed = win.performance.now() - started
      slowFrames = elapsed > 18 ? slowFrames + 1 : Math.max(0, slowFrames - 1)
      if (slowFrames > 12) frameBudget = 1000 / 30
    }
    raf = win.requestAnimationFrame(tick)
  }
  const resume = () => { stop(); if (canRun()) raf = win.requestAnimationFrame(tick) }
  const size = () => {
    if (destroyed) return
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(win.devicePixelRatio || 1, 2)
    width = rect.width; height = rect.height
    pixelRatio = dpr
    if (!width || !height) { stop(); return }
    const fine = pond.options.detail === 'fine'
    const workload = Math.max(1, pond.options.fishCount / 14) * Math.max(1, pond.options.fishSize) ** 2
    const maximum = Math.max(fine ? 180 : 140, Math.floor((fine ? 480 : 300) / Math.sqrt(workload)))
    cellX = Math.max(fine ? 2.5 : 4, Math.min(fine ? 3 : 6, width / (fine ? 360 : 180)), width / maximum)
    cellY = cellX * 1.6
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
    paintedFrame = undefined; rasterBackground = undefined; frameBudget = 1000 / 60; slowFrames = 0
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.font = `500 ${cellY * .78}px ui-monospace, Consolas, monospace`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    pond.aspect = cellY / cellX
    resizePond(pond, Math.max(20, Math.floor(width / cellX)), Math.max(12, Math.floor(height / cellY)))
    columnEdges = Float64Array.from({ length: pond.columns + 1 }, (_, x) => Math.round(x * cellX * dpr) / dpr)
    rowEdges = Float64Array.from({ length: pond.rows + 1 }, (_, y) => Math.round(y * cellY * dpr) / dpr)
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
    if (event.pointerType === 'touch' && (!down || (canvas.style.touchAction !== 'none' && Math.abs(dy) > Math.abs(dx)))) return
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
    getConfig: config,
    setConfig(value) { return controller.setOptions(typeof value === 'string' ? parseConfig(value) : value && typeof value === 'object' && 'version' in value ? parseConfig(JSON.stringify(value)) : validateOptions(value)) },
    resetToDefaults() { controller.setOptions({ ...DEFAULT_OPTIONS, paused: media.matches }); return controller.reset() },
    randomize(seed) { controller.setOptions({ ...randomizeConfig(seed), paused: pond.paused, interactive: pond.options.interactive }); controller.reset(); return config() },
    serialize() { return serializeConfig(config()) },
    setOptions(partial) {
      alive()
      const next = validateOptions(partial, pond.options), environmentChanged = next.environment !== pond.options.environment, detailChanged = next.detail !== pond.options.detail || next.fishCount !== pond.options.fishCount || next.fishSize !== pond.options.fishSize
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
      backgroundCanvas.width = 0; backgroundCanvas.height = 0
    },
  }
  instances.set(canvas, controller)
  size(); announce()
  return Object.freeze(controller)
}


const attributes = { environment: 'environment', speed: 'speed', 'fish-count': 'fishCount', 'fish-size': 'fishSize', varieties: 'varieties', behavior: 'behavior', 'water-color': 'waterColor', 'water-clarity': 'waterClarity', 'caustic-intensity': 'causticIntensity', 'lily-density': 'lilyDensity', 'lotus-count': 'lotusCount', 'particle-density': 'particleDensity', 'ripple-intensity': 'rippleIntensity', 'time-of-day': 'timeOfDay', seed: 'seed', lilies: 'lilies', lotus: 'lotus', detail: 'detail', paused: 'paused', interactive: 'interactive' }
const booleans = new Set(['lilies', 'lotus', 'paused', 'interactive'])
const HTMLElementBase = globalThis.HTMLElement || class {}

function parseAttribute(name, value) {
  if (value === null) return undefined
  if (booleans.has(name)) {
    if (value === '' || value === 'true') return true
    if (value === 'false') return false
    throw new TypeError(`${name} must be true or false`)
  }
  if (name === 'varieties') return value.split(',').map(item => item.trim())
  if (name === 'water-color' && value === 'auto') return null
  if (name === 'time-of-day' && value === 'auto') return 'auto'
  if (['speed', 'fish-count', 'fish-size', 'water-clarity', 'caustic-intensity', 'lily-density', 'lotus-count', 'particle-density', 'ripple-intensity', 'time-of-day', 'seed'].includes(name)) return value.trim() === '' ? NaN : Number(value)
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
      this.pond.setOptions({ [attributes[name]]: parsed === undefined ? DEFAULT_OPTIONS[attributes[name]] : parsed })
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

globalThis.KoiPond = Object.freeze({ createKoiPond, registerKoiPond, KoiPondElement, ENVIRONMENTS, DEFAULT_OPTIONS, VARIETIES, validateOptions, serializeConfig, parseConfig, randomizeConfig });
if (globalThis.customElements && globalThis.HTMLElement) registerKoiPond();
})();
