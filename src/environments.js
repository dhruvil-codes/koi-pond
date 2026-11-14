import { clamp, ramp } from './math.js'

export const ENVIRONMENTS = Object.freeze([
  { id: 'zen', label: 'Zen Garden', description: 'Jade water, mossy granite and quiet pink blossoms' },
  { id: 'moonlight', label: 'Moonlight', description: 'Blue water, broken moonlight and drifting fireflies' },
  { id: 'autumn', label: 'Autumn', description: 'Charcoal water, amber light and falling maple leaves' },
  { id: 'sakura', label: 'Sakura Spring', description: 'Violet water and a canopy of flowering cherry' },
].map(envEntry => Object.freeze(envEntry)))

const envSceneColors = {
  zen: ['001e1c', '186e5c', '17282a', '8b9690', '273b17', '91a13c', '241f1b', '715343', '924455', 'ffbbcb', '933f19', 'f5a735', '195b50', '72b8a2', '3d501b', 'a7aa46'],
  moonlight: ['001020', '0d4563', '172532', '7d8b9c', '243a28', '6d8648', '182331', '4c4c62', '753c68', 'f0a2ce', '79532e', 'd8ab69', '174a6c', 'e3f7f0', '2b4931', '81965a'],
  autumn: ['151e20', '4b4b38', '292b2c', 'a29a7e', '424019', 'a8a446', '291c16', '7a4125', 'a3481d', 'ffb758', '9e2711', 'ff9d22', '68421f', 'fbc783', '564823', 'c4a34b'],
  sakura: ['151d31', '55455f', '2c2c3a', 'a397b4', '303c28', '8a9b55', '282032', '75566c', 'a14f7e', 'ffc1d8', 'ad5373', 'f5aec9', '67405e', 'ffc4d5', '41432d', 'b1a168'],
}

export function resolveEnvironment(id) {
  return ({ midnight: 'moonlight', rain: 'zen', dusk: 'autumn' })[id] || id
}

const envMix = (envA, envB, envT) => '#' + [0, 2, 4].map(envChannel => Math.round(parseInt(envA.slice(envChannel, envChannel + 2), 16) * (1 - envT) + parseInt(envB.slice(envChannel, envChannel + 2), 16) * envT).toString(16).padStart(2, '0')).join('')

export function paletteForEnvironment(id, basePalette, options = {}) {
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
  envPalette.push(...ramp('59622b', 'fff6a1', 6).map(envLight))
  if (envId !== 'zen' || envHour !== null) {
    const envPlantTint = envId === 'moonlight' ? '23405a' : envId === 'autumn' ? '9a732d' : envId === 'sakura' ? '50526c' : '244237'
    for (let envI = 45; envI <= 82; envI++) envPalette[envI] = envLight(envMix(envPalette[envI].slice(1), envPlantTint, envId === 'moonlight' ? .22 : .12))
  }
  return envPalette
}
