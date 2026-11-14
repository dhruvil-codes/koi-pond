import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { readArchive, readEntry, nodeAt, HTML, MODULE } from './patch.mjs'

const source = join(process.env.LOCALAPPDATA, 'Programs/t3code/resources/server.asar')
const target = new URL('./server.patched.asar', import.meta.url)
const before = await readArchive(source), after = await readArchive(target)
let count = 0
function verifyMetadata(node, prefix = '') {
  for (const [key, value] of Object.entries(node.files || {})) {
    const path = prefix ? prefix + '/' + key : key
    if (value.files) verifyMetadata(value, path)
    else if (path !== HTML) { assert.deepEqual(nodeAt(after.header, path).node, value); count++ }
  }
}
verifyMetadata(before.header)
const payloadLength = (await stat(source)).size - before.base
async function rangeHash(path, start, length) {
  const digest = createHash('sha256')
  for await (const chunk of createReadStream(path, { start, end: start + length - 1 })) digest.update(chunk)
  return digest.digest('hex')
}
assert.equal(await rangeHash(source, before.base, payloadLength), await rangeHash(target, after.base, payloadLength))
assert.deepEqual(await readEntry(target, after, MODULE), await readFile(new URL('./midnight-koi-backdrop.js', import.meta.url)))
const index = (await readEntry(target, after, HTML)).toString()
assert.equal(index.split('src="/assets/midnight-koi-backdrop.js"').length - 1, 1)
console.log(`Real T3 archive verified: ${count} original file records unchanged, complete original payload preserved, current backdrop bundled, loader added once. Installed app remains untouched.`)
