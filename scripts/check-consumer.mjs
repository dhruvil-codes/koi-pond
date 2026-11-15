import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { promisify } from 'node:util'
import { copyFile, cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { createContext, Script } from 'node:vm'
import { extname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build as esbuild } from 'esbuild'
import { chromium } from 'playwright'

const runFile = promisify(execFile)
const root = fileURLToPath(new URL('../', import.meta.url))
const fixture = join(root, 'test', 'fixtures', 'consumer')
const proof = join(root, '.local', 'consumer-check')
const npmCli = process.env.npm_execpath
const results = { startedAt: new Date().toISOString(), node: process.version, platform: process.platform, checks: [], versions: {}, scratch: null, error: null }
let browser
const check = (condition, message) => { assert(condition, message); results.checks.push(message); console.log(`PASS ${message}`) }

async function command(label, file, args, cwd, timeout = 180_000, env = {}) {
  console.log(`${label}...`)
  try {
    const result = await runFile(file, args, {
      cwd, timeout, maxBuffer: 12 * 1024 * 1024, windowsHide: true,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', CI: '1', ...env },
    })
    results.checks.push(label)
    return result.stdout
  } catch (error) {
    throw new Error(`${label} failed (${error.code || error.signal || 'unknown'}):\n${(error.stderr || error.stdout || error.message).slice(-5000)}`, { cause: error })
  }
}

function staticServer(base) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      const target = resolve(base, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '')
      const within = relative(base, target)
      if (within.startsWith('..') || isAbsolute(within)) { res.writeHead(403).end(); return }
      const data = await readFile(target)
      res.writeHead(200, { 'content-type': mime[extname(target)] || 'application/octet-stream' }).end(data)
    } catch { res.writeHead(404).end() }
  })
  return server
}

async function listen(server) {
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${server.address().port}`
}

async function withServer(base, fn) {
  const server = staticServer(base)
  const url = await listen(server)
  try { return await fn(url) } finally { await new Promise(resolve => server.close(resolve)) }
}

async function pageAt(url) {
  const page = await browser.newPage({ viewport: { width: 900, height: 640 } })
  page.setDefaultTimeout(15_000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(url)
  return { page, errors }
}

async function renderedCanvas(page, selector) {
  await page.waitForFunction(selector => {
    const canvas = selector === 'koi-pond canvas'
      ? document.querySelector('koi-pond')?.shadowRoot?.querySelector('canvas')
      : document.querySelector(selector)
    return canvas && canvas.width > 0 && canvas.height > 0 && /koi/.test(canvas.getAttribute('aria-label') || '')
  }, selector)
  return page.locator(selector).evaluate(canvas => {
    const { width, height } = canvas
    const context = canvas.getContext('2d')
    const colors = new Set()
    for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 17))) {
      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 17))) {
        colors.add(context.getImageData(x, y, 1, 1).data.slice(0, 3).join(','))
      }
    }
    return { width, height, colors: colors.size, label: canvas.getAttribute('aria-label') }
  })
}

try {
  assert(npmCli && npmCli.endsWith('.js'), 'Run this check through npm so npm_execpath points to npm-cli.js')
  await mkdir(proof, { recursive: true })
  const scratch = await mkdtemp(join(proof, 'run-'))
  const contained = relative(proof, resolve(scratch))
  assert(contained && !contained.startsWith('..') && !isAbsolute(contained), 'Consumer scratch must be inside .local/consumer-check')
  results.scratch = scratch
  const consumer = join(scratch, 'consumer')
  await cp(fixture, consumer, { recursive: true })
  const packed = JSON.parse(await command('Pack distribution without lifecycle scripts', process.execPath,
    [npmCli, 'pack', '--ignore-scripts', '--json', '--pack-destination', scratch], root))
  assert.equal(packed.length, 1)
  const archive = join(scratch, packed[0].filename)
  const names = packed[0].files.map(file => file.path)
  for (const file of ['dist/koi-pond.js', 'dist/koi-pond.iife.js', 'types/index.d.ts', 'examples/ReactPond.jsx', 'examples/embed.html', 'examples/portfolio.html', 'index.html', 'README.md', 'LICENSE']) {
    check(names.includes(file), `Package contains ${file}`)
  }
  check(!names.some(name => /(^|\/)(\.local|node_modules|test|\.env)(\/|$)|\.asar$/.test(name)), 'Package excludes scratch, tests, dependencies and private assets')
  await command('Install packed package and pinned framework versions', process.execPath,
    [npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', archive], consumer)
  const installed = join(consumer, 'node_modules', '@dhruvil-codes', 'koi-pond')
  const pkg = JSON.parse(await readFile(join(installed, 'package.json'), 'utf8'))
  results.versions['koi-pond'] = pkg.version
  check(pkg.name === '@dhruvil-codes/koi-pond' && Object.keys(pkg.dependencies || {}).length === 0, 'Installed package has the expected name and no runtime dependencies')
  check(!['build', 'prepare', 'prepack', 'preinstall', 'install', 'postinstall'].some(name => name in (pkg.scripts || {})) && !pkg.workspaces,
    'Package has no install-time or Git preparation hooks and no workspaces')
  check(pkg.exports?.['.']?.import === './dist/koi-pond.js' && pkg.exports?.['./browser'] === './dist/koi-pond.iife.js', 'Installed package exports ESM and classic browser entries')
  for (const name of ['next', 'react', 'react-dom']) results.versions[name] = JSON.parse(await readFile(join(consumer, 'node_modules', name, 'package.json'), 'utf8')).version
  check(results.versions.next === '16.4.6' && results.versions.react === '19.3.1' && results.versions['react-dom'] === '19.3.1', 'Pinned framework versions installed')

  const module = await import(pathToFileURL(join(installed, 'dist', 'koi-pond.js')).href)
  check(typeof module.createKoiPond === 'function' && typeof module.registerKoiPond === 'function' && module.ENVIRONMENTS.length === 5, 'Packed ESM loads in Node without DOM globals')
  const context = createContext({})
  new Script(await readFile(join(installed, 'dist', 'koi-pond.iife.js'), 'utf8')).runInContext(context)
  check(typeof context.KoiPond?.createKoiPond === 'function' && typeof context.KoiPond?.registerKoiPond === 'function', 'Packed classic script exposes its browser global')
  await command('Compile real consumer TypeScript contracts', process.execPath,
    [join(consumer, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'checks/tsconfig.json'], consumer, 60_000)

  browser = await chromium.launch({ headless: true })
  await withServer(installed, async url => {
    const embed = await pageAt(`${url}/examples/embed.html`)
    try {
      const canvas = await renderedCanvas(embed.page, 'koi-pond canvas')
      check(canvas.colors > 3 && canvas.label.includes('12 koi'), 'Packed classic HTML renders a nonblank custom element')
      check(embed.errors.length === 0, `Classic embed has no browser errors: ${embed.errors.join('; ')}`)
    } finally { await embed.page.close() }
    const portfolio = await pageAt(`${url}/examples/portfolio.html`)
    try {
      const canvas = await renderedCanvas(portfolio.page, '#pond-background')
      check(canvas.colors > 3, 'Packed portfolio renders a nonblank background canvas')
      check(await portfolio.page.locator('.pond-background').getAttribute('aria-hidden') === 'true' &&
        await portfolio.page.locator('.pond-background').evaluate(node => getComputedStyle(node).pointerEvents === 'none'), 'Portfolio pond remains decorative and ignores pointer input')
      check(portfolio.errors.length === 0, `Portfolio has no browser errors: ${portfolio.errors.join('; ')}`)
    } finally { await portfolio.page.close() }
  })

  await mkdir(join(consumer, 'examples'), { recursive: true })
  await copyFile(join(installed, 'examples', 'ReactPond.jsx'), join(consumer, 'examples', 'ReactPond.jsx'))
  const js = await esbuild({ entryPoints: [join(consumer, 'react-entry.jsx')], bundle: true, write: false,
    format: 'iife', platform: 'browser', jsx: 'automatic', absWorkingDir: consumer, define: { 'process.env.NODE_ENV': '"development"' } })
  await writeFile(join(consumer, 'react-bundle.js'), js.outputFiles[0].contents)
  await writeFile(join(consumer, 'react.html'), '<!doctype html><html><body><div id="root"></div><script src="/react-bundle.js"></script></body></html>')
  await withServer(consumer, async url => {
    const { page, errors } = await pageAt(`${url}/react.html`)
    try {
      let canvas = await renderedCanvas(page, 'canvas')
      check(canvas.colors > 3 && canvas.label.includes('7 koi'), 'Exact packaged React example mounts in StrictMode and paints')
      await page.locator('#change').click()
      await page.waitForFunction(() => document.querySelector('canvas')?.getAttribute('aria-label')?.includes('16 koi'))
      check(await page.locator('canvas').count() === 1, 'React prop update keeps one canvas and updates fish count')
      await page.evaluate(() => {
        window.__oldCanvas = document.querySelector('canvas')
        window.__oldEvents = 0
        window.__oldCanvas.addEventListener('pondchange', () => window.__oldEvents++)
      })
      await page.locator('#toggle').click()
      await page.locator('canvas').waitFor({ state: 'detached' })
      const detached = await page.evaluate(() => {
        const before = window.__oldEvents
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
        window.__oldCanvas.dispatchEvent(event)
        return { events: window.__oldEvents - before, prevented: event.defaultPrevented, label: window.__oldCanvas.getAttribute('aria-label') }
      })
      check(detached.events === 0 && !detached.prevented && detached.label === 'Interactive koi pond', 'React unmount destroys old controller and keyboard listeners')
      await page.locator('#toggle').click()
      canvas = await renderedCanvas(page, 'canvas')
      check(canvas.colors > 3 && canvas.label.includes('16 koi') && await page.locator('canvas').count() === 1, 'React remount paints with retained props and one live canvas')
      check(errors.length === 0, `React lifecycle has no browser errors: ${errors.join('; ')}`)
    } finally { await page.close() }
  })

  const nextCli = join(consumer, 'node_modules', 'next', 'dist', 'bin', 'next')
  await command('Build Next.js production static export', process.execPath, [nextCli, 'build'], consumer, 180_000)
  const output = join(consumer, 'out')
  const html = await readFile(join(output, 'index.html'), 'utf8')
  check(html.includes('Packaged pond consumer') && html.includes('Interactive koi pond'), 'Next.js statically prerenders the packaged React example')
  await withServer(output, async url => {
    const { page, errors } = await pageAt(url)
    try {
      let canvas = await renderedCanvas(page, 'canvas')
      check(canvas.colors > 3 && canvas.label.includes('6 koi'), 'Next.js production page hydrates and paints the pond')
      await page.locator('#next-change').click()
      await page.waitForFunction(() => document.querySelector('canvas')?.getAttribute('aria-label')?.includes('13 koi'))
      canvas = await renderedCanvas(page, 'canvas')
      check(canvas.colors > 3 && canvas.label.includes('13 koi'), 'Next.js hydrated props update the packed controller')
      check(errors.length === 0, `Next.js hydration has no browser errors: ${errors.join('; ')}`)
    } finally { await page.close() }
  })

  const gitSource = join(scratch, 'git-source')
  const gitConsumer = join(scratch, 'git-consumer')
  await cp(installed, gitSource, { recursive: true })
  await command('Initialize private package Git fixture', 'git', ['init', '-q'], gitSource, 30_000)
  await command('Stage private package Git fixture', 'git', ['add', '-A'], gitSource, 30_000)
  await command('Commit private package Git fixture', 'git',
    ['-c', 'user.name=Consumer Check', '-c', 'user.email=consumer-check@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'Packed package fixture'], gitSource, 30_000)
  await mkdir(gitConsumer)
  await writeFile(join(gitConsumer, 'package.json'), '{"name":"git-consumer","private":true,"type":"module"}\n')
  await command('Install private Git source with ordinary npm lifecycle', process.execPath,
    [npmCli, 'install', '--no-audit', '--no-fund', '--package-lock=false', `git+${pathToFileURL(gitSource).href}`], gitConsumer)
  const gitInstalled = join(gitConsumer, 'node_modules', '@dhruvil-codes', 'koi-pond')
  const gitPkg = JSON.parse(await readFile(join(gitInstalled, 'package.json'), 'utf8'))
  const gitModule = await import(pathToFileURL(join(gitInstalled, 'dist', 'koi-pond.js')).href)
  check(gitPkg.version === pkg.version && typeof gitModule.createKoiPond === 'function', 'Fresh Git consumer installs committed distribution without source build')
} catch (error) {
  results.error = error.stack || String(error)
  process.exitCode = 1
  console.error(error)
} finally {
  await browser?.close()
  results.finishedAt = new Date().toISOString()
  await mkdir(proof, { recursive: true })
  await writeFile(join(proof, 'results.json'), JSON.stringify(results, null, 2) + '\n')
  if (!results.error) console.log(`Passed ${results.checks.length} installed-package checks.`)
  console.log(`Consumer evidence: ${join(proof, 'results.json')}`)
}
