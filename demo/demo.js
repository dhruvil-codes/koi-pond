(() => {
  const byId = id => document.getElementById(id), status = byId('status'), canvas = byId('pond')
  let initial = {}, target = 'javascript'
  const readHash = () => {
    const encoded = new URLSearchParams(location.hash.slice(1)).get('pond')
    return encoded ? KoiPond.parseConfig(encoded) : null
  }
  try { initial = readHash() || {} } catch (error) { status.textContent = `${error.message}. Showing the default pond.` }
  let pond
  try { pond = KoiPond.createKoiPond(canvas, initial); canvas.pond = pond }
  catch (error) { status.textContent = `The pond could not start: ${error.message}`; return }
  const controls = { fish: 'fishCount', speed: 'speed', 'fish-size': 'fishSize', behavior: 'behavior', 'water-color': 'waterColor', 'lily-density': 'lilyDensity', 'lotus-count': 'lotusCount', 'particle-density': 'particleDensity', 'ripple-intensity': 'rippleIntensity', 'time-of-day': 'timeOfDay', seed: 'seed', detail: 'detail' }
  const percent = value => `${Math.round(value * 100)}%`, multiplier = value => `${Number(value.toFixed(2))}×`
  const update = () => {
    const config = pond.getConfig()
    const aliases = { midnight: 'moonlight', rain: 'zen', dusk: 'autumn' }, id = aliases[config.environment] || config.environment
    const environment = KoiPond.ENVIRONMENTS.find(item => item.id === id)
    byId('scene-name').textContent = environment.label; byId('scene-seed').textContent = `seed ${config.seed}`
    for (const button of document.querySelectorAll('[data-environment]')) button.setAttribute('aria-pressed', String(button.dataset.environment === id))
    for (const [name, key] of Object.entries(controls)) {
      if (name === 'water-color' || name === 'time-of-day') continue
      byId(name).value = config[key]
    }
    byId('fish-value').value = config.fishCount; byId('speed-value').value = multiplier(config.speed); byId('fish-size-value').value = multiplier(config.fishSize)
    byId('lily-density-value').value = percent(config.lilyDensity); byId('lotus-count-value').value = config.lotusCount; byId('particle-density-value').value = percent(config.particleDensity); byId('ripple-intensity-value').value = multiplier(config.rippleIntensity)
    for (const input of document.querySelectorAll('[name=variety]')) input.checked = config.varieties.includes(input.value)
    byId('water-color').value = config.waterColor || ({ zen: '#063b35', moonlight: '#09263e', autumn: '#342a20', sakura: '#35304a' })[id]
    byId('water-color-value').textContent = config.waterColor || 'Preset'
    byId('preset-water').setAttribute('aria-pressed', String(config.waterColor === null))
    const time = byId('time-of-day'), timeValue = String(config.timeOfDay)
    if (![...time.options].some(option => option.value === timeValue)) {
      const custom = time.querySelector('[data-custom]') || document.createElement('option')
      custom.dataset.custom = ''; custom.value = timeValue; custom.textContent = `${String(Math.floor(config.timeOfDay)).padStart(2, '0')}:${String(Math.round(config.timeOfDay % 1 * 60)).padStart(2, '0')}`; time.append(custom)
    }
    time.value = timeValue
    byId('pause').textContent = config.paused ? 'Play' : 'Pause'; byId('pause').setAttribute('aria-pressed', String(config.paused))
    byId('embed-code').textContent = generateSnippet(config, target)
  }
  const apply = change => {
    try { pond.setOptions(change); status.textContent = '' }
    catch (error) { status.textContent = error.message; update() }
  }
  canvas.addEventListener('pondchange', update)
  for (const button of document.querySelectorAll('[data-environment]')) button.addEventListener('click', () => { apply({ environment: button.dataset.environment }); status.textContent = `${button.textContent.trim()} selected. Fish settings are kept.` })
  for (const [name, key] of Object.entries(controls)) byId(name).addEventListener(name === 'seed' ? 'change' : ['behavior', 'detail', 'time-of-day'].includes(name) ? 'change' : 'input', event => {
    const value = event.target.value
    apply({ [key]: ['behavior', 'detail', 'water-color'].includes(name) ? value : name === 'time-of-day' && value === 'auto' ? 'auto' : Number(value) })
  })
  for (const input of document.querySelectorAll('[name=variety]')) input.addEventListener('change', () => apply({ varieties: [...document.querySelectorAll('[name=variety]:checked')].map(item => item.value) }))
  byId('preset-water').addEventListener('click', () => apply({ waterColor: null }))
  byId('pause').addEventListener('click', () => { pond.toggle(); status.textContent = pond.getState().paused ? 'Pond paused.' : 'Koi are swimming.' })
  byId('reset').addEventListener('click', () => { pond.resetToDefaults(); status.textContent = 'Default scene and settings restored.' })
  byId('randomize').addEventListener('click', () => { pond.randomize(); status.textContent = 'A new scene is ready. Copy its link or configuration to keep it.' })
  byId('new-seed').addEventListener('click', () => { const seed = crypto.getRandomValues(new Uint32Array(1))[0]; apply({ seed }) })
  byId('snapshot').addEventListener('click', () => { const link = document.createElement('a'); link.href = pond.exportPNG(); link.download = `koi-pond-${pond.getConfig().environment}.png`; link.click(); status.textContent = 'Image download started.' })
  const tabs = (selector, select) => {
    const buttons = [...document.querySelectorAll(selector)]
    for (const button of buttons) {
      button.addEventListener('click', () => { for (const item of buttons) { item.setAttribute('aria-selected', String(item === button)); item.tabIndex = item === button ? 0 : -1 }; select(button) })
      button.addEventListener('keydown', event => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
        event.preventDefault(); let index = buttons.indexOf(button)
        index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length
        buttons[index].click(); buttons[index].focus()
      })
    }
  }
  tabs('[data-panel]', button => { for (const panel of document.querySelectorAll('.panel')) panel.hidden = panel.id !== `panel-${button.dataset.panel}` })
  tabs('[data-target]', button => { target = button.dataset.target; update() })
  const copy = async (text, message, node) => {
    try { await navigator.clipboard.writeText(text); status.textContent = message }
    catch {
      if (node) { const range = document.createRange(); range.selectNodeContents(node); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); status.textContent = 'Text selected. Press Ctrl+C or Command+C to copy.' }
      else { byId('import-panel').open = true; byId('import-config').value = text; byId('import-config').focus(); byId('import-config').select(); status.textContent = 'Link or configuration selected. Press Ctrl+C or Command+C to copy.' }
    }
  }
  byId('copy-install').addEventListener('click', () => copy(INSTALL_COMMAND, 'Install command copied.', byId('install-command')))
  byId('copy-code').addEventListener('click', () => copy(generateSnippet(pond.getConfig(), target), 'Integration code copied.', byId('embed-code')))
  byId('copy-json').addEventListener('click', () => copy(KoiPond.serializeConfig(pond.getConfig()), 'JSON configuration copied.'))
  byId('share').addEventListener('click', () => {
    const local = ['file:', 'about:', 'data:'].includes(location.protocol) || ['localhost', '127.0.0.1', ''].includes(location.hostname)
    const url = new URL(local ? 'https://dhruvil-codes.github.io/koi-pond/' : location.href)
    url.hash = 'pond=' + encodeURIComponent(KoiPond.serializeConfig(pond.getConfig()))
    copy(url.href, 'Share link copied. The same settings and seed will load for anyone who opens it.')
  })
  byId('apply-config').addEventListener('click', () => {
    try { pond.setConfig(byId('import-config').value); status.textContent = 'Configuration applied.' }
    catch (error) { status.textContent = error.message }
  })
  window.addEventListener('hashchange', () => { try { const next = readHash(); if (next) { pond.setConfig(next); status.textContent = 'Shared configuration loaded.' } } catch (error) { status.textContent = error.message } })
  update()
})()
