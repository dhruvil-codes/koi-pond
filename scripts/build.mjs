import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join, relative, resolve, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build as esbuild } from 'esbuild'

const root = new URL('../', import.meta.url)
const rootPath = fileURLToPath(root)
const read = path => readFile(new URL(path, root), 'utf8')
// The source uses only local, single-line imports and named exports.
const stripModule = source => source.replace(/^import .*?\r?\n/gm, '').replace(/^export\s*\{[^\n]*\}\s*;?\r?$/gm, '').replace(/^export /gm, '')
export async function coreBundle() {
  return (await Promise.all(['src/math.js', 'src/palette.js', 'src/config.js', 'src/environments.js', 'src/environment.js', 'src/fish.js', 'src/core.js'].map(read))).map(stripModule).join('\n')
}

async function playgroundAssets() {
  const localRoot = resolve(rootPath, '.local')
  await mkdir(localRoot, { recursive: true })
  const scratch = await mkdtemp(join(localRoot, 'koi-pond-build-'))
  const assertScratchIsLocal = () => {
    const relativeToLocal = relative(localRoot, resolve(scratch))
    if (!relativeToLocal || relativeToLocal.startsWith('..') || isAbsolute(relativeToLocal)) {
      throw new Error(`Refusing to clean build scratch path outside .local: ${scratch}`)
    }
  }
  try {
    const jsBuild = await esbuild({
      entryPoints: ['demo/main.tsx'],
      bundle: true,
      minify: true,
      legalComments: 'inline',
      format: 'iife',
      platform: 'browser',
      target: ['es2020'],
      define: { 'process.env.NODE_ENV': '"production"' },
      write: false,
      metafile: true,
      absWorkingDir: rootPath
    })
    const output = Object.values(jsBuild.metafile.outputs)[0]
    const kumoSources = Object.entries(output.inputs)
      .filter(([path, info]) => path.startsWith('node_modules/@cloudflare/kumo/') && /\.[cm]?js$/i.test(path) && info.bytesInOutput > 0)
      .map(([path]) => resolve(rootPath, path))
    if (!kumoSources.length) throw new Error('No bundled Kumo JavaScript sources found for Tailwind scanning')

    const cssInputPath = join(scratch, 'playground.css')
    const cssOutputPath = join(scratch, 'playground.min.css')
    const importedStylesheet = relative(scratch, resolve(rootPath, 'demo/styles.css')).replace(/\\/g, '/')
    const sourceDirectives = [...new Set(kumoSources)]
      .sort()
      .map(path => `@source ${JSON.stringify(relative(scratch, path).replace(/\\/g, '/'))};`)
    await writeFile(cssInputPath, [`@import ${JSON.stringify(importedStylesheet)};`, ...sourceDirectives].join('\n') + '\n')

    const cliPath = fileURLToPath(new URL('../node_modules/@tailwindcss/cli/dist/index.mjs', import.meta.url))
    const cssBuild = spawnSync(process.execPath, [cliPath, '-i', cssInputPath, '-o', cssOutputPath, '--minify'], {
      cwd: rootPath,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024
    })
    if (cssBuild.status !== 0) throw new Error(`Tailwind CSS build failed:\n${cssBuild.stderr || cssBuild.stdout}`)
    const font = await readFile(new URL('demo/assets/inter-latin-variable.woff2', root))
    const css = (await readFile(cssOutputPath, 'utf8')).replaceAll('__INTER_FONT__', `data:font/woff2;base64,${font.toString('base64')}`)
    return { css, js: jsBuild.outputFiles[0].text }
  } finally {
    assertScratchIsLocal()
    await rm(scratch, { recursive: true, force: true })
  }
}

export async function build() {
  const core = await coreBundle()
  const source = core + '\n' + (await Promise.all(['src/pond.js', 'src/element.js'].map(read))).map(stripModule).join('\n')
  const names = 'createKoiPond, registerKoiPond, KoiPondElement, ENVIRONMENTS, DEFAULT_OPTIONS, VARIETIES, validateOptions, serializeConfig, parseConfig, randomizeConfig'
  const register = "if (globalThis.customElements && globalThis.HTMLElement) registerKoiPond();"
  const { version } = JSON.parse(await read('package.json'))
  const banner = `/*! Koi Pond v${version} | Copyright 2026 Dhruvil | MIT License */\n`
  const esm = `${banner}${source}\nexport { ${names} };\n${register}\n`
  const classic = `${banner}(() => {\n'use strict';\n${source}\nglobalThis.KoiPond = Object.freeze({ ${names} });\n${register}\n})();\n`
  await mkdir(new URL('dist/', root), { recursive: true })
  await writeFile(new URL('dist/koi-pond.js', root), esm)
  await writeFile(new URL('dist/koi-pond.iife.js', root), classic)

  const template = await read('demo/template.html')
  const { css, js } = await playgroundAssets()
  // HTML terminates a script element even inside a JavaScript string. Escape
  // literal closing tags so arbitrary bundled package text cannot break it.
  const notices = (await read('docs/THIRD-PARTY-NOTICES.md')).replace(/\*\//g, '* /')
  const safeJs = `/*! ${notices}\n*/\n${js}`.replace(/<\/script/gi, match => match.replace('/', '\\/'))
  const replacements = [
    ['<!-- APP_STYLES -->', `<style>${css}</style>`],
    ['<!-- POND_BUNDLE -->', `<script>${classic}</script>`],
    ['<!-- PLAYGROUND_BUNDLE -->', `<script>${safeJs}</script>`]
  ]
  let html = template
  for (const [marker, content] of replacements) {
    if (!html.includes(marker)) throw new Error(`demo/template.html is missing required build marker: ${marker}`)
    html = html.replace(marker, () => content)
  }
  await writeFile(new URL('index.html', root), html.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, ''))
  console.log(`Built ESM, classic browser script and standalone index.html (${Math.round(classic.length / 1024)} KB library, inline React UI and CSS).`)
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build()
