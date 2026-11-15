import { clamp, ramp } from './math.js'

export const ENVIRONMENTS = Object.freeze([
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
  envPalette.push(...ramp(envId === 'daylight' ? 'a98336' : '59622b', envId === 'daylight' ? 'fff3bb' : 'fff6a1', 6).map(envLight))
  const envLeaves = ramp(...envLeafColors[envId], 12)
  for (let envI = 0; envI < 12; envI++) envPalette[45 + envI] = envLeaves[envI]
  if (envId !== 'zen' || envHour !== null) {
    const envPlantTint = envId === 'moonlight' ? '23405a' : envId === 'autumn' ? '9a732d' : envId === 'sakura' ? '50526c' : envId === 'daylight' ? '8e9f49' : '244237'
    for (let envI = 45; envI <= 82; envI++) envPalette[envI] = envLight(envMix(envPalette[envI].slice(1), envPlantTint, envId === 'moonlight' ? .22 : .12))
  }
  return envPalette
}
