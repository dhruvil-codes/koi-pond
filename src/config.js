export const VARIETIES = Object.freeze(['kohaku', 'sanke', 'ogon', 'shusui'])
export const DEFAULT_OPTIONS = Object.freeze({ environment: 'zen', fishCount: 12, speed: 1.35, fishSize: 1, varieties: VARIETIES, behavior: 'wander', waterColor: null, lilyDensity: .7, lotusCount: 2, particleDensity: .45, rippleIntensity: 1, timeOfDay: 'auto', seed: 2026, lilies: true, lotus: true, detail: 'fine', paused: false, interactive: true })
const optionKeys = new Set(Object.keys(DEFAULT_OPTIONS))
const configEnvironments = ['zen', 'moonlight', 'autumn', 'sakura', 'midnight', 'rain', 'dusk']

export function validateOptions(partial = {}, current = DEFAULT_OPTIONS) {
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

export function serializeConfig(options = {}) {
  return JSON.stringify({ version: 1, options: validateOptions(options) })
}

export function parseConfig(input) {
  if (typeof input !== 'string' || input.length > 10000) throw new TypeError('Configuration must be a JSON string under 10 KB')
  let value
  try { value = JSON.parse(input) } catch { throw new TypeError('Configuration is not valid JSON') }
  if (value && typeof value === 'object' && 'version' in value) {
    if (value.version !== 1 || Object.keys(value).some(key => !['version', 'options'].includes(key)) || !value.options) throw new RangeError('Unsupported configuration format')
    value = value.options
  }
  return validateOptions(value)
}

export function randomizeConfig(seed = Math.floor(Math.random() * 4294967296)) {
  validateOptions({ seed })
  let state = seed >>> 0
  const next = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
  const choose = values => values[Math.floor(next() * values.length)]
  const round = n => Math.round(n * 100) / 100
  const varieties = VARIETIES.filter(() => next() > .25)
  return validateOptions({ environment: choose(configEnvironments.slice(0, 4)), fishCount: 6 + Math.floor(next() * 15), speed: round(.5 + next() * 1.4), fishSize: round(.75 + next() * .55), varieties: varieties.length ? varieties : ['kohaku'], behavior: choose(['wander', 'school', 'circle']), lilyDensity: round(.25 + next() * .65), lotusCount: 1 + Math.floor(next() * 4), particleDensity: round(.2 + next() * .6), rippleIntensity: round(.5 + next()), seed })
}
