import test from 'node:test'
import assert from 'node:assert/strict'
import { createKoiPond } from '../src/pond.js'

function browser({ reduced = false } = {}) {
  let now = 100, next = 0
  const frames = new Map(), observers = [], intersections = []
  const media = new EventTarget(); media.matches = reduced
  const doc = new EventTarget(); doc.hidden = false
  const win = new EventTarget()
  Object.assign(win, {
    AbortController, CustomEvent, devicePixelRatio: 3, performance: { now: () => now }, matchMedia: () => media,
    requestAnimationFrame: fn => { const id = ++next; frames.set(id, fn); return id },
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class { constructor(fn) { this.fn = fn; observers.push(this) } observe() {} disconnect() { this.disconnected = true } },
    IntersectionObserver: class { constructor(fn) { this.fn = fn; intersections.push(this) } observe() {} disconnect() { this.disconnected = true } },
  })
  doc.defaultView = win
  const canvas = () => {
    const node = new EventTarget(), attributes = new Map([['role', 'presentation']])
    const ctx = { rectCount: 0, fillRect() { this.rectCount++ }, fillText() {}, setTransform(...args) { this.transform = args } }
    Object.assign(node, {
      ownerDocument: doc, style: { touchAction: 'auto' }, ctx, bounds: { left: 0, top: 0, width: 720, height: 480 },
      getContext: () => ctx, getBoundingClientRect() { return this.bounds },
      getAttribute: key => attributes.get(key) ?? null, setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key),
      toDataURL: () => 'data:image/png;base64,fixture',
    })
    return node
  }
  const step = () => { now += 20; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now)) }
  const pointer = (node, type, props = {}) => {
    const event = new Event(type, { cancelable: true })
    Object.assign(event, { clientX: 250, clientY: 200, button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true, ...props })
    node.dispatchEvent(event)
  }
  return { win, doc, media, canvas, frames, observers, intersections, step, pointer }
}

test('independent instances validate updates atomically, preserve state and clean up completely', () => {
  const b = browser(), first = b.canvas(), second = b.canvas()
  const a = createKoiPond(first), c = createKoiPond(second, { environment: 'rain' })
  assert.equal(first.width, 1440, 'Device pixel ratio is capped at two')
  assert.throws(() => createKoiPond(first), /already/)
  a.feed(.5, .5)
  assert.equal(a.getState().foodCount, 1)
  assert.equal(c.getState().foodCount, 0)
  a.setOptions({ environment: 'dusk', speed: 2, fishCount: 12 })
  assert.equal(a.getState().foodCount, 1, 'Changing environments preserves food')
  const before = a.getState()
  assert.throws(() => a.setOptions({ environment: 'rain', fishCount: -1 }))
  assert.deepEqual(a.getState(), before)
  assert.throws(() => a.feed(NaN, .5))
  assert.throws(() => a.ripple(.5, .5, Infinity))
  assert(Object.isFrozen(a.getState()))
  assert(a.exportPNG().startsWith('data:image/png'))
  a.pause(); assert.equal(b.frames.size, 1, 'Pausing one pond keeps the other animation alive')
  a.play(); a.reset()
  assert.equal(a.getState().environment, 'dusk')
  assert.equal(a.getState().fishCount, 12)
  assert.equal(a.getState().foodCount, 0)
  a.destroy(); a.destroy()
  assert(a.getState().destroyed)
  assert.throws(() => a.play(), /destroyed/)
  assert.equal(first.getAttribute('role'), 'presentation')
  assert.equal(first.style.touchAction, 'auto')
  assert(b.observers[0].disconnected && b.intersections[0].disconnected)
  b.pointer(first, 'pointerdown'); b.pointer(first, 'pointerup')
  assert.equal(a.getState().foodCount, 0, 'Destroyed listeners cannot feed')
  const replacement = createKoiPond(first); replacement.destroy(); c.destroy()
  assert.equal(b.frames.size, 0)
})

test('primary taps feed; returned drags, scrolling, cancelled and secondary pointers do not', () => {
  const b = browser(), canvas = b.canvas(), pond = createKoiPond(canvas)
  b.pointer(canvas, 'pointerdown'); b.pointer(canvas, 'pointerup')
  assert.equal(pond.getState().foodCount, 1)
  b.pointer(canvas, 'pointerdown'); b.pointer(canvas, 'pointermove', { clientX: 300 }); b.pointer(canvas, 'pointerup')
  assert.equal(pond.getState().foodCount, 1, 'Returning a dragged pointer to its origin is not a tap')
  b.pointer(canvas, 'pointerdown', { pointerType: 'touch' }); b.pointer(canvas, 'pointermove', { pointerType: 'touch', clientY: 280 }); b.pointer(canvas, 'pointercancel'); b.pointer(canvas, 'pointerup')
  b.pointer(canvas, 'pointerdown', { button: 2 }); b.pointer(canvas, 'pointerup', { button: 2 })
  b.pointer(canvas, 'pointerdown', { isPrimary: false }); b.pointer(canvas, 'pointerup')
  assert.equal(pond.getState().foodCount, 1)
  pond.setOptions({ interactive: false })
  b.pointer(canvas, 'pointerdown'); b.pointer(canvas, 'pointerup')
  assert.equal(pond.getState().foodCount, 1)
  pond.destroy()
})

test('reduced motion, hidden windows and offscreen ponds stop their clocks and resume once', () => {
  const b = browser({ reduced: true }), pond = createKoiPond(b.canvas())
  assert(pond.getState().paused); assert.equal(b.frames.size, 0)
  pond.play(); assert.equal(b.frames.size, 1)
  b.step(); b.step()
  b.doc.hidden = true; b.doc.dispatchEvent(new Event('visibilitychange'))
  assert.equal(b.frames.size, 0)
  b.doc.hidden = false; b.doc.dispatchEvent(new Event('visibilitychange'))
  assert.equal(b.frames.size, 1)
  b.intersections[0].fn([{ isIntersecting: false }]); assert.equal(b.frames.size, 0)
  b.intersections[0].fn([{ isIntersecting: true }]); assert.equal(b.frames.size, 1)
  b.media.matches = true; b.media.dispatchEvent(new Event('change'))
  assert(pond.getState().paused); assert.equal(b.frames.size, 0)
  pond.destroy()
})

test('fullscreen hosts can opt into vertical touch ripples without changing scrollable embeds', () => {
  for (const touchAction of ['auto', 'none']) {
    const b = browser(), canvas = b.canvas()
    canvas.style.touchAction = touchAction
    const pond = createKoiPond(canvas, { paused: true })
    const before = canvas.ctx.rectCount
    b.pointer(canvas, 'pointerdown', { pointerType: 'touch' })
    b.pointer(canvas, 'pointermove', { pointerType: 'touch', clientY: 250 })
    assert.equal(canvas.ctx.rectCount > before, touchAction === 'none', 'Vertical touch stirs only a host that owns the gesture')
    b.pointer(canvas, 'pointerup', { pointerType: 'touch', clientY: 250 })
    assert.equal(pond.getState().foodCount, 0, 'Stirring never feeds')
    pond.destroy()
    assert.equal(canvas.style.touchAction, touchAction, 'The host touch policy is restored')
  }
})

test('full configurations, density budgets and stationary frames remain independent and predictable', () => {
  const b = browser(), canvas = b.canvas(), pond = createKoiPond(canvas)
  const initialRects = canvas.ctx.rectCount, initialFont = parseFloat(canvas.ctx.font.split(' ')[1])
  pond.pause()
  assert.equal(canvas.ctx.rectCount, initialRects, 'Pausing an unchanged frame does not repaint cached scenery')
  const snapshot = pond.getConfig()
  assert(Object.isFrozen(snapshot.varieties))
  pond.setConfig({ version: 1, options: { environment: 'autumn', seed: 42, fishCount: 30, fishSize: 1.8, paused: true } })
  assert.equal(pond.getConfig().fishCount, 30)
  assert(parseFloat(canvas.ctx.font.split(' ')[1]) > initialFont, 'High load uses larger cells to stay within the rendering budget')
  const original = pond.serialize()
  assert.throws(() => pond.setConfig('{'))
  assert.equal(pond.serialize(), original)
  pond.randomize(123)
  assert(pond.getConfig().paused, 'Randomizing keeps an intentionally paused preview still')
  pond.resetToDefaults()
  assert.equal(pond.getConfig().fishCount, 12)
  pond.destroy()
  const reduced = browser({ reduced: true }), calm = createKoiPond(reduced.canvas())
  calm.resetToDefaults()
  assert(calm.getConfig().paused, 'Default reset respects reduced motion')
  calm.destroy()
})
