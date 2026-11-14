import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { repack, readArchive, readEntry, nodeAt, integrity, assertClosed, assertArchiveClosed, assertRestoreHash, sha, HTML, MODULE } from './patch.mjs';

function fixture(entries) {
  const header = { files: {} }, parts = [];
  let offset = 0;
  for (const [path, text] of entries) {
    const bytes = Buffer.from(text);
    const { parent, name } = nodeAt(header, path, true);
    parent.files[name] = { size: bytes.length, offset: String(offset), integrity: integrity(bytes) };
    parts.push(bytes); offset += bytes.length;
  }
  const json = Buffer.from(JSON.stringify(header)), aligned = Math.ceil(json.length / 4) * 4;
  const prefix = Buffer.alloc(16 + aligned);
  prefix.writeUInt32LE(4, 0); prefix.writeUInt32LE(8 + aligned, 4);
  prefix.writeUInt32LE(4 + aligned, 8); prefix.writeUInt32LE(json.length, 12); json.copy(prefix, 16);
  return Buffer.concat([prefix, ...parts]);
}
test('append-only repack preserves unchanged bytes, offsets and integrity', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'koi-asar-'));
  try {
    const source = join(dir, 'original.asar'), output = join(dir, 'patched.asar');
    const original = fixture([['package.json', '{"version":"0.1.9"}'], [HTML, '<head></head>'], ['assets/untouched.bin', '\0original\u00ffcontent']]);
    await writeFile(source, original);
    const html = Buffer.from('<head><script type="module"></script></head>');
    const module = Buffer.alloc(4194304 + 19, 75);
    await repack(source, output, [[HTML, html], [MODULE, module]]);
    const before = await readArchive(source), after = await readArchive(output);
    for (const path of ['package.json', 'assets/untouched.bin']) {
      assert.deepEqual(await readEntry(output, after, path), await readEntry(source, before, path));
      assert.deepEqual(nodeAt(after.header, path).node, nodeAt(before.header, path).node);
    }
    assert.deepEqual(await readEntry(output, after, HTML), html);
    assert.deepEqual(await readEntry(output, after, MODULE), module);
    assert.deepEqual(nodeAt(after.header, MODULE).node.integrity, integrity(module));
    assert.equal(nodeAt(after.header, MODULE).node.integrity.blocks.length, 2);
    assert.deepEqual((await readFile(output)).subarray(after.base, after.base + original.length - before.base), original.subarray(before.base));
    assert.deepEqual(await readFile(source), original);
    await assert.rejects(repack(source, source, []), /differ/);
  } finally {
    const target = resolve(dir);
    assert.equal(dirname(target).toLowerCase(), resolve(tmpdir()).toLowerCase());
    assert(basename(target).startsWith('koi-asar-'));
    await rm(target, { recursive: true, force: true });
  }
});
test('running-app and changed-hash guards fail closed', () => {
  assert.throws(() => assertClosed(['node', 'T3 Code (Beta)', 'explorer']), /Close every/);
  assert.throws(() => assertClosed(['T3 Code (Beta).exe']), /Close every/);
  assert.doesNotThrow(() => assertClosed(['node', 'explorer']));
  assert.throws(() => assertArchiveClosed([{ name: 'node.exe', usesArchive: true }]), /backend/);
  assert.doesNotThrow(() => assertArchiveClosed([{ name: 'node.exe', usesArchive: false }]));
  assert.throws(() => assertRestoreHash(sha('updated app'), { patchedHash: sha('our patch') }), /Restore refused/);
  assert.doesNotThrow(() => assertRestoreHash('same', { patchedHash: 'same' }));
});
test('adapter keeps canvas passive and CSS limited to the native theme', async () => {
  const adapter = await readFile(new URL('./backdrop-adapter.js', import.meta.url), 'utf8');
  const css = adapter.split('style.textContent = `')[1].split('`;')[0].replaceAll('${THEME_ID}', 'midnight-koi-animated');
  for (const selector of css.split('{').slice(0, -1)) assert.match(selector.slice(selector.lastIndexOf('}') + 1), /html\[data-theme-id=/);
  assert.match(css, /pointer-events:none/);
  assert.match(adapter, /attributeFilter: \['data-theme-id'\]/);
  assert.match(adapter, /prefers-reduced-motion/);
  assert.match(adapter, /document.hidden/);
  assert.doesNotMatch(adapter, /preventDefault|stopPropagation|fetch\(|XMLHttpRequest/);
});
