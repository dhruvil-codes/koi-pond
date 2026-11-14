(() => {
  const element = document.getElementById('pond'), pond = element.pond
  const byId = id => document.getElementById(id)
  const status = byId('status')
  if (!pond) { status.textContent = 'The pond could not start. Check that your browser supports canvas and custom elements.'; return }
  const embed = state => `<script src="./koi-pond.iife.js"><\/script>\n<koi-pond environment="${state.environment}" speed="${state.speed}" fish-count="${state.fishCount}"\n  lilies="${state.lilies}" lotus="${state.lotus}" detail="${state.detail}"\n  style="height:480px"></koi-pond>`
  const update = () => {
    const s = pond.getState()
    for (const button of document.querySelectorAll('[data-environment]')) button.setAttribute('aria-pressed', String(button.dataset.environment === s.environment))
    byId('pause').textContent = s.paused ? 'Play' : 'Pause'; byId('pause').setAttribute('aria-pressed', String(s.paused))
    byId('speed').value = s.speed; byId('speed-value').value = `${s.speed.toFixed(2)}×`
    byId('fish').value = s.fishCount; byId('fish-value').value = s.fishCount
    byId('lilies').checked = s.lilies; byId('lotus').checked = s.lotus; byId('detail').value = s.detail
    byId('eaten').textContent = s.eaten
    byId('scene-description').textContent = KoiPond.ENVIRONMENTS.find(env => env.id === s.environment).description
    byId('embed-code').textContent = embed(s)
  }
  element.addEventListener('pondchange', () => { update(); status.textContent = '' })
  element.addEventListener('ponderror', event => { status.textContent = event.detail.message })
  for (const button of document.querySelectorAll('[data-environment]')) button.addEventListener('click', () => { pond.setOptions({ environment: button.dataset.environment }); status.textContent = `${button.textContent} environment selected.` })
  byId('pause').addEventListener('click', () => { pond.toggle(); status.textContent = pond.getState().paused ? 'Pond paused.' : 'Koi are swimming.' })
  byId('reset').addEventListener('click', () => { pond.reset(); status.textContent = 'Pond reset. Your settings are kept.' })
  byId('speed').addEventListener('input', event => pond.setOptions({ speed: Number(event.target.value) }))
  byId('fish').addEventListener('input', event => pond.setOptions({ fishCount: Number(event.target.value) }))
  for (const key of ['lilies', 'lotus']) byId(key).addEventListener('change', event => pond.setOptions({ [key]: event.target.checked }))
  byId('detail').addEventListener('change', event => pond.setOptions({ detail: event.target.value }))
  byId('snapshot').addEventListener('click', () => {
    const link = document.createElement('a')
    link.href = pond.exportPNG(); link.download = `koi-pond-${pond.getState().environment}.png`; link.click()
    status.textContent = 'Pond image saved.'
  })
  byId('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(byId('embed-code').textContent); status.textContent = 'Embed copied.' }
    catch {
      const range = document.createRange(); range.selectNodeContents(byId('embed-code'))
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range)
      status.textContent = 'Embed selected. Press Ctrl+C or Command+C to copy.'
    }
  })
  update()
})()
