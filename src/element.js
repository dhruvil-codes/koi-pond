import { createKoiPond } from './pond.js'

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

export class KoiPondElement extends HTMLElementBase {
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

export function registerKoiPond(tagName = 'koi-pond') {
  if (!globalThis.customElements) return undefined
  const registered = globalThis.customElements.get(tagName)
  if (registered) return registered
  // Each alias needs its own constructor in the custom-element registry.
  const Element = tagName === 'koi-pond' ? KoiPondElement : class extends KoiPondElement {}
  globalThis.customElements.define(tagName, Element)
  return Element
}
