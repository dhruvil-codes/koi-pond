export { createKoiPond } from './pond.js'
export { KoiPondElement, registerKoiPond } from './element.js'
export { ENVIRONMENTS } from './environments.js'
export { DEFAULT_OPTIONS, VARIETIES, validateOptions, serializeConfig, parseConfig, randomizeConfig } from './config.js'

import { registerKoiPond } from './element.js'
if (globalThis.customElements && globalThis.HTMLElement) registerKoiPond()
