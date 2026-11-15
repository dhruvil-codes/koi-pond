import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const pageURL = new URL('../index.html', import.meta.url).href
const proof = new URL('../.local/ui-check/', import.meta.url)
await mkdir(proof, { recursive: true })
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
await context.setOffline(true)
await context.addInitScript(() => {
  window.__copies = []
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => window.__copies.push(text) } })
})
const page = await context.newPage()
page.setDefaultTimeout(8000)
const errors = []
page.on('pageerror', error => errors.push(error.message))
const results = []
const check = (condition, message) => { assert(condition, message); results.push(message) }
const config = () => page.evaluate(() => document.querySelector('#pond').pond.getConfig())
const select = async (label, option) => {
  await page.getByRole('combobox', { name: label, exact: true }).click()
  const alignment = await page.locator('.pond-select [role=option]').evaluateAll(nodes => nodes.map(node => {
    const row = node.getBoundingClientRect(), text = node.lastElementChild.getBoundingClientRect()
    return text.left - row.left
  }))
  check(Math.max(...alignment) - Math.min(...alignment) < 1, label + ': selected and unselected option labels align')
  const menu = await page.locator('.pond-select').boundingBox(), dock = await page.locator('.pond-dock').boundingBox()
  check(menu.y >= 0 && menu.y + menu.height <= dock.y - 4, label + ': dropdown stays above the dock')
  await page.getByRole('option', { name: option, exact: true }).click()
}
const slider = async (label, key, expected, keypress = 'End') => {
  await page.getByRole('slider', { name: label, exact: true }).press(keypress)
  await page.waitForFunction(([key, value]) => document.querySelector('#pond').pond.getConfig()[key] === value, [key, expected])
}
const open = async id => { if (await page.locator('#' + id).getAttribute('aria-expanded') !== 'true') await page.locator('#' + id).click(); await page.locator('.pond-popover[data-state=open]').waitFor() }
const close = async () => { await page.keyboard.press('Escape'); await page.locator('.pond-popover').waitFor({ state: 'detached' }) }
const lastCopy = () => page.evaluate(() => window.__copies.at(-1))
const noScroll = async label => {
  const size = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, x: scrollX, y: scrollY }))
  check(size.scrollWidth <= size.width && size.scrollHeight <= size.height && !size.x && !size.y, label + ': no page scrolling')
  const dock = await page.locator('.pond-dock').boundingBox()
  check(dock && dock.x >= 0 && dock.x + dock.width <= size.width && dock.y >= 0 && dock.y + dock.height <= size.height, label + ': dock fits')
}
const panelFits = async label => {
  const box = await page.locator('.pond-popover[data-state=open]').boundingBox()
  const viewport = page.viewportSize()
  check(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, label + ': panel fits viewport')
  const scroll = await page.locator('.pond-popover[data-state=open]').evaluate(node => ({ client: node.clientHeight, scroll: node.scrollHeight }))
  check(scroll.scroll <= scroll.client + 1, label + ': all controls visible without panel scrolling')
}
const sceneButtonsFit = async label => {
  const boxes = await page.locator('.scene-choice').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect(), copy = node.querySelector('.scene-copy')
    return { width: rect.width, height: rect.height, textFits: copy.scrollWidth <= copy.clientWidth + 1 }
  }))
  check(Math.max(...boxes.map(box => box.width)) - Math.min(...boxes.map(box => box.width)) < 1, label + ': scene buttons fill equal columns')
  check(boxes.every(box => box.textFits) && Math.max(...boxes.map(box => box.height)) - Math.min(...boxes.map(box => box.height)) < 1, label + ': scene captions fit equal-height buttons ' + JSON.stringify(boxes))
}
try {
  await page.goto(pageURL)
  await page.waitForFunction(() => document.querySelector('#pond')?.pond)
  await page.evaluate(() => document.fonts.ready)
  check(await page.evaluate(() => document.fonts.check('500 13px Inter') && [...document.fonts].some(font => font.family === 'Inter' && font.status === 'loaded')), 'Inter font loads offline from the standalone page')
  check(await page.locator('.pond-dock button').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).fontFamily.startsWith('Inter'))), 'Every dock button uses Inter')
  check(await page.locator('.pond-dock [data-kumo-component=Button]').evaluateAll(nodes => nodes.every(node => getComputedStyle(node.firstElementChild).backgroundImage.includes('linear-gradient'))), 'Every dock action uses the Kumo primary gradient')
  check(await page.locator('.pond-dock [data-kumo-component=Button]').evaluateAll(nodes => new Set(nodes.map(node => getComputedStyle(node).getPropertyValue('--color-kumo-brand').trim())).size === nodes.length), 'Each dock action has a distinct primary colour')
  check(await page.locator('#embed').getAttribute('aria-label') === 'Copy the command', 'Command button uses the requested label')
  check(await page.locator('.topbar,.scene-name,.scene-seed,.developer,.inspector').count() === 0, 'Old headings and dashboard chrome removed')
  const canvasSize = await page.locator('#pond').boundingBox()
  check(canvasSize.width === 1440 && canvasSize.height === 900, 'Pond fills viewport')
  await noScroll('Desktop')
  await page.locator('#pause').click()
  check((await config()).paused, 'Kumo pause button controls the engine')
  await page.screenshot({ path: fileURLToPath(new URL('desktop.png', proof)) })
  await page.locator('#pond').focus(); await page.keyboard.press('Space')
  check(!(await config()).paused, 'Space resumes pond')
  await page.keyboard.press('Enter')
  check(await page.evaluate(() => document.querySelector('#pond').pond.getState().foodCount) === 1, 'Keyboard feeding works')
  await page.locator('#pond').click({ position: { x: 600, y: 300 } })
  check(await page.evaluate(() => document.querySelector('#pond').pond.getState().foodCount) >= 2, 'Pond tap feeds the koi')
  const filteredPointers = await page.evaluate(() => {
    const canvas = document.querySelector('#pond'), pond = canvas.pond, before = pond.getState().foodCount
    const pointer = (type, extra = {}) => canvas.dispatchEvent(new PointerEvent(type, { pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, clientX: 100, clientY: 100, ...extra }))
    pointer('pointerdown'); pointer('pointermove', { clientX: 200 }); pointer('pointerup')
    pointer('pointerdown', { pointerType: 'touch' }); pointer('pointermove', { pointerType: 'touch', clientY: 200 }); pointer('pointercancel'); pointer('pointerup')
    pointer('pointerdown', { button: 2 }); pointer('pointerup', { button: 2 })
    return before === pond.getState().foodCount
  })
  check(filteredPointers, 'Dragging, cancelled touch and secondary clicks do not feed')
  check(await page.evaluate(() => {
    const element = document.createElement('koi-pond'); element.style.height = '100px'; element.setAttribute('paused', 'true'); element.setAttribute('varieties', 'ogon,shusui'); element.setAttribute('lotus-count', '4'); document.body.append(element)
    const accepted = element.pond && element.pond.getConfig().lotusCount === 4 && element.pond.getConfig().varieties.join() === 'ogon,shusui'
    const first = element.pond; element.remove(); const destroyed = first.getState().destroyed
    document.body.append(element); const reconnected = element.pond && !element.pond.getState().destroyed; element.remove()
    return accepted && destroyed && reconnected
  }), 'Custom elements accept settings, release resources, and reconnect')

  await open('controls')
  check(await page.getByRole('tab', { name: 'Koi', exact: true }).evaluate(node => !!document.getElementById(node.getAttribute('aria-controls'))), 'Settings tab is linked to its panel')
  await slider('Fish count', 'fishCount', 30)
  await slider('Swim speed', 'speed', 3)
  await slider('Fish size', 'fishSize', 1.8)
  await select('Movement', 'Swim together')
  for (const name of ['Kohaku', 'Sanke', 'Shusui']) await page.getByRole('button', { name, exact: true }).click()
  const fish = await config()
  check(fish.behavior === 'school' && fish.varieties.length === 1 && fish.varieties[0] === 'ogon', 'Movement and variety controls update immediately')
  check(await page.getByRole('button', { name: 'Ogon', exact: true }).isDisabled(), 'At least one variety stays selected')
  await page.screenshot({ path: fileURLToPath(new URL('desktop-controls.png', proof)) })
  await close()
  check(await page.locator('#controls').evaluate(node => node === document.activeElement), 'Escape restores focus to dock trigger')
  for (const environment of ['moonlight', 'autumn', 'sakura', 'zen']) {
    await open('environments'); await sceneButtonsFit('Selected ' + environment); await page.locator('[data-environment=' + environment + ']').click()
    const next = await config()
    check(next.environment === environment && ['fishCount', 'speed', 'fishSize', 'behavior', 'varieties'].every(key => JSON.stringify(next[key]) === JSON.stringify(fish[key])), environment + ': environment preserves fish settings')
  }

  await open('controls'); await page.getByRole('tab', { name: 'Water', exact: true }).click()
  await slider('Lily pads', 'lilyDensity', 1)
  await slider('Lotus flowers', 'lotusCount', 6)
  await slider('Ripples', 'rippleIntensity', 2)
  await page.locator('#water-color').evaluate(node => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, '#123456')
    node.dispatchEvent(new Event('input', { bubbles: true }))
    node.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await page.waitForFunction(() => document.querySelector('#pond').pond.getConfig().waterColor === '#123456')
  await page.getByRole('switch', { name: 'Lily pads', exact: true }).click()
  await page.getByRole('switch', { name: 'Lotus flowers', exact: true }).click()
  check(!(await config()).lilies && !(await config()).lotus, 'Vegetation switches work')
  await page.locator('#preset-water').click()
  check((await config()).waterColor === null, 'Preset water color restores')
  await page.getByRole('tab', { name: 'Atmosphere', exact: true }).click()
  await slider('Floating particles', 'particleDensity', 1)
  await select('Time of day', 'Dusk')
  await page.locator('#seed').fill('42')
  await select('Render quality', 'Balanced')
  await page.getByRole('switch', { name: 'Pointer interactions', exact: true }).click()
  const atmosphere = await config()
  check(atmosphere.timeOfDay === 18 && atmosphere.seed === 42 && atmosphere.detail === 'balanced' && !atmosphere.interactive, 'Time, seed, detail and interaction controls work')
  await page.locator('#new-seed').click()
  check((await config()).seed !== 42, 'New seed button works')
  await close()

  await open('embed')
  check((await lastCopy()).includes('#v0.2.1'), 'Dock command action copies the install command directly')
  for (const target of ['javascript', 'html', 'react', 'next']) {
    await page.locator('[data-target=' + target + ']').click()
    const exact = await page.evaluate(() => {
      const text = document.querySelector('#embed-code').textContent
      const start = text.indexOf('const config = ') + 15
      return JSON.stringify(JSON.parse(text.slice(start, text.indexOf(';', start)))) === JSON.stringify(document.querySelector('#pond').pond.getConfig())
    })
    check(exact, target + ': code matches current settings exactly')
  }
  await page.locator('#copy-install').click()
  check((await lastCopy()).includes('#v0.2.1'), 'Install command copies actual published Git tag')
  await page.locator('#copy-code').click()
  check((await lastCopy()).includes("'use client'"), 'Copy code uses selected framework')
  await page.locator('[data-target=json]').click(); await page.locator('#copy-json').click()
  const jsonCopy = await lastCopy()
  check(JSON.stringify(JSON.parse(jsonCopy).options) === JSON.stringify(await config()), 'JSON export exact')
  await page.locator('#share').click()
  const shareLink = new URL(await lastCopy())
  check(JSON.stringify(JSON.parse(new URLSearchParams(shareLink.hash.slice(1)).get('pond')).options) === JSON.stringify(await config()), 'Share link exact')
  check(shareLink.origin === 'https://koi-pond.bydhruvil.in', 'Offline share links use public custom domain')
  const sharedPage = await context.newPage()
  await sharedPage.goto(pageURL + shareLink.hash)
  await sharedPage.waitForFunction(() => document.querySelector('#pond')?.pond)
  check(JSON.stringify(await sharedPage.evaluate(() => document.querySelector('#pond').pond.getConfig())) === JSON.stringify(await config()), 'Opening a shared URL restores exact settings')
  const hashConfig = await sharedPage.evaluate(() => window.KoiPond.serializeConfig(window.KoiPond.randomizeConfig(314)))
  await sharedPage.evaluate(value => { location.hash = 'pond=' + encodeURIComponent(value) }, hashConfig)
  await sharedPage.waitForFunction(() => document.querySelector('#pond').pond.getConfig().seed === 314)
  check(JSON.stringify(await sharedPage.evaluate(() => document.querySelector('#pond').pond.getConfig())) === JSON.stringify(JSON.parse(hashConfig).options), 'Hash changes restore settings without remounting')
  await sharedPage.close()
  await page.locator('[data-target=import]').click()
  const beforeInvalid = JSON.stringify(await config())
  await page.locator('#import-config').fill('{'); await page.locator('#apply-config').click()
  check(await page.locator('#import-error').isVisible() && JSON.stringify(await config()) === beforeInvalid, 'Invalid import displays error without changing pond')
  const imported = await page.evaluate(() => window.KoiPond.serializeConfig(window.KoiPond.randomizeConfig(987)))
  await page.locator('#import-config').fill(imported); await page.locator('#apply-config').click()
  check(JSON.stringify(await config()) === JSON.stringify(JSON.parse(imported).options), 'Valid import restores configuration')
  await close()
  await page.locator('#randomize').click()
  check((await config()).seed !== 987, 'Randomize button works')
  await open('more')
  const download = page.waitForEvent('download')
  await page.locator('#snapshot').click()
  check((await download).suggestedFilename().endsWith('.png'), 'Save image downloads PNG')
  await open('more'); await page.locator('#reset').click()
  check(await page.evaluate(() => JSON.stringify(document.querySelector('#pond').pond.getConfig()) === JSON.stringify(window.KoiPond.validateOptions())), 'Reset restores defaults')

  await open('embed'); await page.locator('[data-target=javascript]').click()
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied') } } }))
  await page.locator('#copy-code').click()
  check(await page.locator('#copy-fallback').evaluate(node => node === document.activeElement && node.selectionEnd === node.value.length), 'Clipboard denial offers selected manual copy')
  await close()
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => window.__copies.push(text) } }))

  const visibleFood = await page.evaluate(() => {
    const canvas = document.querySelector('#pond'), pond = canvas.pond
    pond.setOptions({ fishCount: 1, fishSize: 1, speed: 3, paused: true, environment: 'zen' }); pond.reset()
    const context = canvas.getContext('2d'), x = Math.floor(canvas.width * .52), y = Math.floor(canvas.height * .24), radius = 24
    const before = context.getImageData(x - radius, y - radius, radius * 2, radius * 2).data
    pond.feed(.52, .24)
    const after = context.getImageData(x - radius, y - radius, radius * 2, radius * 2).data
    let visiblePixels = 0
    for (let i = 0; i < after.length; i += 4) if (Math.max(Math.abs(after[i] - before[i]), Math.abs(after[i + 1] - before[i + 1]), Math.abs(after[i + 2] - before[i + 2])) > 70) visiblePixels++
    return visiblePixels
  })
  check(visibleFood > 50, 'Food has a clearly visible footprint on the actual canvas')
  await page.screenshot({ path: fileURLToPath(new URL('visible-food.png', proof)) })
  await page.evaluate(() => document.querySelector('#pond').pond.play())
  await page.waitForFunction(() => document.querySelector('#pond').pond.getState().eaten === 1, null, { timeout: 15000 })
  check(await page.evaluate(() => document.querySelector('#pond').pond.getState().foodCount === 0), 'Live koi consume the visible pellet and remove it')
  await page.evaluate(() => document.querySelector('#pond').pond.resetToDefaults())

  for (const [label, width, height] of [['Desktop',1440,900], ['Laptop',1280,720], ['Mobile',390,844], ['Small mobile',320,568], ['Landscape',568,320], ['Tablet',768,1024]]) {
    await page.setViewportSize({ width, height })
    await noScroll(label)
    await open('environments'); await panelFits(label + ' scenes'); await sceneButtonsFit(label); if (label === 'Desktop') await page.screenshot({ path: fileURLToPath(new URL('scenes.png', proof)) }); await close()
    await open('controls')
    for (const category of ['Koi','Water','Atmosphere']) { await page.getByRole('tab', { name: category, exact: true }).click(); await panelFits(label + ' ' + category) }
    await select('Time of day', 'Dawn')
    await page.getByRole('combobox', { name: 'Time of day', exact: true }).click()
    if (label === 'Desktop') await page.screenshot({ path: fileURLToPath(new URL('dropdown.png', proof)) })
    await page.keyboard.press('Escape')
    check(await page.locator('.pond-popover[data-state=open]').count() === 1, label + ': Escape dismisses dropdown while keeping settings open')
    if (label === 'Mobile') await page.screenshot({ path: fileURLToPath(new URL('mobile-controls.png', proof)) })
    await close()
    await open('more'); await panelFits(label + ' actions'); await close()
    await open('embed'); await page.locator('[data-target=javascript]').click(); await panelFits(label + ' embed'); await close()
    if (label === 'Landscape' || label === 'Small mobile') {
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied') } } }))
      await open('embed'); await page.locator('#copy-fallback').waitFor(); await panelFits(label + ' manual copy'); await close()
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => window.__copies.push(text) } }))
    }
    if (label === 'Mobile') await page.screenshot({ path: fileURLToPath(new URL('mobile.png', proof)) })
  }
  const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await reduced.setOffline(true)
  const reducedPage = await reduced.newPage()
  await reducedPage.goto(pageURL)
  await reducedPage.waitForFunction(() => document.querySelector('#pond')?.pond)
  check(await reducedPage.evaluate(() => document.querySelector('#pond').pond.getConfig().paused), 'Reduced motion starts pond paused')
  await reducedPage.close(); await reduced.close()
  check(errors.length === 0, 'No browser runtime errors: ' + errors.join('; '))
  await writeFile(new URL('results.json', proof), JSON.stringify({ checks: results.length, results, errors }, null, 2))
  console.log(`Passed ${results.length} browser checks: Kumo actions, ReUI controls, exact copy/share/import, offline embedding, keyboard, reduced motion and six viewport layouts.`)
  console.log('Visual checks saved in .local/ui-check/')
} catch (error) {
  await page.screenshot({ path: fileURLToPath(new URL('failure.png', proof)) }).catch(() => {})
  throw error
} finally { await context.close(); await browser.close() }
