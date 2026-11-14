export const ENVIRONMENTS = Object.freeze([
  { id: 'midnight', label: 'Midnight', description: 'Black still water' },
  { id: 'rain', label: 'Rain', description: 'Cool teal water with gentle rainfall rings' },
  { id: 'dusk', label: 'Dusk', description: 'Warm dark water with drifting petals' },
].map(environment => Object.freeze(environment)))

const WATER = {
  midnight: null,
  rain: ['#031011', '#07191a', '#0b2222', '#12302d', '#29413b', '#52675b', '#eee8d8', '#99592a', '#c98135', '#dfaa60', '#62685b', '#787a6c', '#b7b29f', '#b45d42', '#3b3e37'],
  dusk: ['#100908', '#1b100d', '#291713', '#382019', '#56382b', '#80604a', '#eee8d8', '#99592a', '#c98135', '#dfaa60', '#62685b', '#787a6c', '#b7b29f', '#b45d42', '#3b3e37'],
}

export function paletteForEnvironment(id, basePalette) {
  if (id === 'midnight') return basePalette.slice()
  const water = WATER[id]
  if (!water) throw new RangeError(`Unknown environment: ${id}`)
  return [...water, ...basePalette.slice(water.length)]
}
