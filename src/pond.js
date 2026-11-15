import { createPond, configurePond, validateOptions, advance, renderPond, resizePond, feed, disturb } from './core.js'
import { DEFAULT_OPTIONS, parseConfig, serializeConfig, randomizeConfig } from './config.js'

const instances = new WeakMap()
const bounded = n => Math.max(0, Math.min(1, n))

export function createKoiPond(canvas, options = {}) {
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
