export { createKoiPond } from './pond.js'
export { KoiPondElement, registerKoiPond } from './element.js'
export { ENVIRONMENTS } from './environments.js'

import { registerKoiPond } from './element.js'
if (globalThis.customElements && globalThis.HTMLElement) registerKoiPond()
