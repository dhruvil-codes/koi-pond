import { createHash } from 'node:crypto';
import { open, readFile, writeFile, rename, copyFile, stat, mkdir, unlink } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HTML = 'apps/server/dist/client/index.html';
export const MODULE = 'apps/server/dist/client/assets/midnight-koi-backdrop.js';
const VERSION = '0.1.9';
const ORIGINAL_HASH = '7d1f34ec709016f6e65552755761230ffe92555daeab6adcef0b555638945366';
const INDEX_HASH = 'ffbad5da04cf3c2dc795fd8439e9ae95e825f94b767961ddf3634e1e124194a2';
const home = dirname(fileURLToPath(import.meta.url));
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
export function nodeAt(header, path, create = false) {
  let parent = header;
  const names = path.split('/');
  for (const name of names.slice(0, -1)) {
    if (create) { parent.files ||= {}; parent.files[name] ||= { files: {} }; }
    parent = parent.files?.[name];
    if (!parent) throw Error(`Missing ASAR directory: ${path}`);
  }
  if (create) parent.files ||= {};
  return { parent, name: names.at(-1), node: parent.files?.[names.at(-1)] };
}
export async function readArchive(path) {
  const file = await open(path, 'r');
  try {
    const prefix = Buffer.alloc(16); await file.read(prefix, 0, 16, 0);
    const length = prefix.readUInt32LE(12);
    if (prefix.readUInt32LE(0) !== 4 || length > 32 * 1024 * 1024 || length < 2) throw Error('Invalid ASAR header');
    const bytes = Buffer.alloc(length); await file.read(bytes, 0, length, 16);
    const header = JSON.parse(bytes.toString('utf8'));
    const base = 16 + Math.ceil(length / 4) * 4;
    return { header, base };
  } finally { await file.close(); }
}
export async function readEntry(path, archive, entry) {
  const { node } = nodeAt(archive.header, entry);
  if (!node || node.unpacked || node.link || !Number.isSafeInteger(node.size)) throw Error(`Unsupported ASAR entry: ${entry}`);
  const file = await open(path, 'r');
  try {
    const bytes = Buffer.alloc(node.size);
    const { bytesRead } = await file.read(bytes, 0, bytes.length, archive.base + Number(node.offset));
    if (bytesRead !== bytes.length) throw Error(`Truncated ASAR entry: ${entry}`);
    return bytes;
  } finally { await file.close(); }
}
export function integrity(bytes) {
  const blockSize = 4194304, blocks = [];
  for (let i = 0; i < bytes.length; i += blockSize) blocks.push(sha(bytes.subarray(i, i + blockSize)));
  return { algorithm: 'SHA256', hash: sha(bytes), blockSize, blocks };
}
export async function repack(source, destination, replacements) {
  if (resolve(source) === resolve(destination)) throw Error('Repack output must differ from source');
  const archive = await readArchive(source);
  const header = structuredClone(archive.header);
  let offset = (await stat(source)).size - archive.base;
  for (const [path, bytes] of replacements) {
    const { parent, name } = nodeAt(header, path, true);
    parent.files[name] = { size: bytes.length, offset: String(offset), integrity: integrity(bytes) };
    offset += bytes.length;
  }
  const json = Buffer.from(JSON.stringify(header)), aligned = Math.ceil(json.length / 4) * 4;
  const prefix = Buffer.alloc(16 + aligned);
  prefix.writeUInt32LE(4, 0); prefix.writeUInt32LE(8 + aligned, 4);
  prefix.writeUInt32LE(4 + aligned, 8); prefix.writeUInt32LE(json.length, 12); json.copy(prefix, 16);
  const out = await open(destination, 'wx');
  try { await out.writeFile(prefix); } finally { await out.close(); }
  await pipeline(createReadStream(source, { start: archive.base }), createWriteStream(destination, { flags: 'a' }));
  const append = await open(destination, 'a');
  try { for (const [, bytes] of replacements) await append.writeFile(bytes); await append.sync(); }
  finally { await append.close(); }
}
export function assertClosed(processNames) {
  if (processNames.some(name => /^T3 Code \(Beta\)(?:\.exe)?$/i.test(name.trim()))) throw Error('Close every T3 Code (Beta) window before applying or restoring. No processes were stopped.');
}
export function assertArchiveClosed(processes) {
  assertClosed(processes.map(process => process.name));
  if (processes.some(process => process.usesArchive)) throw Error('A T3 backend is still using the installed archive. Quit T3 completely before applying or restoring. No processes were stopped.');
}
function checkProcesses() {
  if (process.platform !== 'win32') throw Error('Apply and restore are supported only on Windows');
  const resource = join(process.env.LOCALAPPDATA || '', 'Programs/t3code/resources/server.asar').replaceAll('\\', '/').toLowerCase().replaceAll("'", "''");
  // Only names and the archive-use flag leave PowerShell; command lines may contain secrets.
  const command = `$taskArchive='${resource}'; $taskBlocked=@(Get-CimInstance Win32_Process -ErrorAction Stop | ForEach-Object { $taskUses=($_.Name -match '^(node|bun)\\.exe$' -and $_.CommandLine -and $_.CommandLine.Replace('\\','/').ToLowerInvariant().Contains($taskArchive)); if ($_.Name -ieq 'T3 Code (Beta).exe' -or $taskUses) { [PSCustomObject]@{name=$_.Name;usesArchive=[bool]$taskUses} } }); ConvertTo-Json -InputObject $taskBlocked -Compress`;
  const output = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8', windowsHide: true });
  assertArchiveClosed(JSON.parse(output));
}
export function assertRestoreHash(current, receipt) {
  if (current !== receipt.patchedHash) throw Error('Restore refused: installed archive differs from this patch. An app update or another modification may be present.');
}
async function replaceClosed(source, target, expectedHash) {
  checkProcesses();
  if (await hashFile(target) !== expectedHash) throw Error('Installed archive changed during preparation; refusing replacement');
  const temporary = `${target}.midnight-koi-${process.pid}.tmp`;
  try {
    await copyFile(source, temporary);
    if (await hashFile(temporary) !== await hashFile(source)) throw Error('Temporary archive verification failed');
    checkProcesses();
    if (await hashFile(target) !== expectedHash) throw Error('Installed archive changed before replacement');
    await rename(temporary, target);
  } finally { await unlink(temporary).catch(() => {}); }
}
export async function main(args = process.argv.slice(2)) {
  const mode = args[0];
  if (!['--dry-run', '--apply', '--restore'].includes(mode)) throw Error('Usage: node patch.mjs --dry-run|--apply|--restore [--archive path]');
  if (args.length !== 1 && !(args.length === 3 && args[1] === '--archive')) throw Error('Unexpected arguments');
  const archivePath = resolve(args[2] || join(process.env.LOCALAPPDATA || '', 'Programs/t3code/resources/server.asar'));
  const stateDir = join(home, 'backup'), receiptPath = join(stateDir, 'receipt.json'), backup = join(stateDir, 'server.original.asar');
  if (mode !== '--dry-run') checkProcesses();
  if (mode === '--restore') {
    const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
    if (receipt.archivePath !== archivePath) throw Error('Receipt belongs to a different installation');
    assertRestoreHash(await hashFile(archivePath), receipt);
    if (await hashFile(backup) !== receipt.originalHash) throw Error('Original backup hash mismatch');
    await replaceClosed(backup, archivePath, receipt.patchedHash);
    console.log('Restored the original archive. Theme entries remain available in app preferences.'); return;
  }
  const originalHash = await hashFile(archivePath);
  if (originalHash !== ORIGINAL_HASH) throw Error('Unsupported archive hash. This package supports the inspected T3 Code 0.1.9 archive only; no changes made.');
  const archive = await readArchive(archivePath);
  const pkg = JSON.parse((await readEntry(archivePath, archive, 'package.json')).toString());
  if (pkg.version !== VERSION) throw Error('Unsupported T3 Code version');
  const index = await readEntry(archivePath, archive, HTML);
  if (sha(index) !== INDEX_HASH) throw Error('Original index.html does not match the inspected app');
  const module = await readFile(join(home, 'midnight-koi-backdrop.js'));
  const script = '<script type="module" src="/assets/midnight-koi-backdrop.js"></script>';
  const html = index.toString();
  if (!html.includes('</head>') || html.includes('midnight-koi-backdrop')) throw Error('Unexpected HTML structure');
  const output = join(home, `server.patched-${process.pid}.asar`);
  try {
    await repack(archivePath, output, [[HTML, Buffer.from(html.replace('</head>', script + '\n</head>'))], [MODULE, module]]);
    const patched = await readArchive(output);
    if (sha(await readEntry(output, patched, MODULE)) !== sha(module)) throw Error('Patched module verification failed');
    const patchedHash = await hashFile(output);
    if (mode === '--dry-run') {
      const preview = join(home, 'server.patched.asar'); await rename(output, preview);
      console.log(JSON.stringify({ mode, output: preview, originalHash, patchedHash, version: VERSION }, null, 2)); return;
    }
    await mkdir(stateDir, { recursive: true });
    let prior;
    try { prior = JSON.parse(await readFile(receiptPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (prior && (prior.originalHash !== originalHash || prior.archivePath !== archivePath)) throw Error('Existing backup belongs to a different installation');
    try { await copyFile(archivePath, backup, 1); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    if (await hashFile(backup) !== originalHash) throw Error('Backup hash mismatch');
    // Record recovery information before replacement, so interruption cannot leave an untracked patch.
    await writeFile(receiptPath, JSON.stringify({ archivePath, version: VERSION, originalHash, patchedHash, createdAt: new Date().toISOString() }, null, 2));
    await replaceClosed(output, archivePath, originalHash);
    console.log('Applied Midnight Koi. Original archive and hash receipt are in native/backup.');
  } finally { await unlink(output).catch(() => {}); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
