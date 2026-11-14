// Bundled after ascii-pond.js by build.mjs. Runs only inside the patched app.
import { l as selectTheme, c as setAppearance, s as refreshTheme } from './useTheme-CuZZWvKw.js';
import { w as invalidateThemeLibrary } from './themePalette-oA-712GZ.js';

const THEME_ID = 'midnight-koi-animated';
const LIBRARY_KEY = 't3code:themes:v1';
const FIRST_RUN_KEY = 'midnight-koi:animated-installed:v1';
const nativeTheme = {
  id: THEME_ID, label: 'Midnight Koi (animated)', appearance: 'dark',
  colors: {
    canvas: '#000000', chrome: '#090a09', surface: '#111210', surfaceRaised: '#181a16',
    surfaceOverlay: '#181a16', text: '#eeeadd', textMuted: '#b2b5a8', accent: '#cb7250',
    accentForeground: '#090a09', border: '#30332c', input: '#30332c', focus: '#df9a6a',
    toolbar: '#090a09', toolbarForeground: '#eeeadd', toolbarBorder: '#30332c',
    toolbarControl: '#171914', toolbarControlForeground: '#eeeadd', toolbarControlHover: '#252820',
    sidebar: '#090a09', sidebarForeground: '#eeeadd', sidebarMutedForeground: '#b2b5a8',
    sidebarBorder: '#30332c', sidebarRowHover: '#20231d', sidebarRowActive: '#30332c',
    sidebarRowSelected: '#30332c', sidebarControlSurface: '#181a16',
    muted: '#20231d', mutedForeground: '#b2b5a8', secondary: '#20231d', secondaryForeground: '#eeeadd',
    placeholder: '#989d90', secondaryLabel: '#b2b5a8', iconMuted: '#b2b5a8',
    accentSurface: '#34291f', accentSurfaceForeground: '#e6b897',
    messageSurface: '#111210', messageForeground: '#eeeadd', codeBackground: '#090a09',
    messageAction: '#cb7250', messageActionForeground: '#090a09', messageActionHover: '#df936a',
    codeForeground: '#eeeadd', terminalBackground: '#090a09', terminalForeground: '#eeeadd',
    terminalCursor: '#df9a6a', terminalSelection: '#40392a'
  }
};

function registerTheme() {
  // A malformed existing library is preserved; never overwrite data we cannot interpret.
  const raw = localStorage.getItem(LIBRARY_KEY);
  const library = raw === null ? [] : JSON.parse(raw);
  if (!Array.isArray(library)) throw Error('Unexpected native theme library format');
  if (!library.some(theme => theme?.id === THEME_ID)) {
    const updated = JSON.stringify([...library, nativeTheme]);
    localStorage.setItem(LIBRARY_KEY, updated);
    // Registration can run before React attaches storage listeners on first boot.
    invalidateThemeLibrary();
    window.dispatchEvent(new StorageEvent('storage', { key: LIBRARY_KEY, oldValue: raw, newValue: updated, storageArea: localStorage }));
  }
  refreshTheme();
  if (!localStorage.getItem(FIRST_RUN_KEY)) {
    if (setAppearance('dark') && selectTheme(THEME_ID)) localStorage.setItem(FIRST_RUN_KEY, '1');
  }
}

const style = document.createElement('style');
style.textContent = `
html[data-theme-id="${THEME_ID}"] { background:#000!important; --background:transparent!important; }
html[data-theme-id="${THEME_ID}"] body { background:transparent!important; }
html[data-theme-id="${THEME_ID}"] #root { position:relative; z-index:1; background:transparent!important; }
html[data-theme-id="${THEME_ID}"] main[data-slot="sidebar-inset"] { background:transparent!important; }
html[data-theme-id="${THEME_ID}"] [data-slot="sidebar-inner"] { background:rgba(9,10,9,.96)!important; }
html[data-theme-id="${THEME_ID}"] [data-slot="card"],
html[data-theme-id="${THEME_ID}"] [data-slot="popover-content"],
html[data-theme-id="${THEME_ID}"] [data-slot="dialog-content"],
html[data-theme-id="${THEME_ID}"] [data-slot="dropdown-menu-content"] { background:rgba(17,18,16,.97)!important; }
html[data-theme-id="${THEME_ID}"] pre { background:rgba(9,10,9,.96)!important; }
html[data-theme-id="${THEME_ID}"] [aria-label="Conversation"] :is(p,li,h1,h2,h3,h4,blockquote) { text-shadow:0 1px 2px #000,0 0 5px #000; }
html[data-theme-id="${THEME_ID}"] textarea,
html[data-theme-id="${THEME_ID}"] [contenteditable="true"] { background:rgba(9,10,9,.96)!important; }
html[data-theme-id="${THEME_ID}"] #midnight-koi-backdrop { position:fixed; inset:0; width:100%; height:100%; z-index:0; pointer-events:none; background:#000; }
`;
document.head.append(style);

const canvas = document.createElement('canvas');
canvas.id = 'midnight-koi-backdrop';
canvas.setAttribute('aria-hidden', 'true');
const ctx = canvas.getContext('2d', { alpha: false });
const background = document.createElement('canvas');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let pond = createPond(100, 40, 1.6, { environment: 'moonlight' }), cellX = 6.5, cellY = 10.4, width = 0, height = 0;
let active = false, raf = 0, previous = 0;

function paint() {
  if (!active || !ctx) return;
  const frame = renderPond(pond);
  const nativePalette = frame.palette;
  ctx.fillStyle = nativePalette[0]; ctx.fillRect(0, 0, width, height);
  for (let y = 0; y < frame.rows; y++) for (let x = 0; x < frame.columns; x++) {
    const i = y * frame.columns + x;
    if (frame.chars[i] === 32 && !frame.coverage[i]) continue;
    ctx.fillStyle = nativePalette[frame.colors[i]];
    // Fractional cell material creates connected koi bodies with subtle ASCII ink.
    if (frame.coverage[i]) {
      ctx.globalAlpha = frame.coverage[i] / 255;
      const inset = frame.colors[i] >= 91 && frame.colors[i] <= 106 && frame.chars[i] === 32 ? 0 : .1;
      ctx.fillRect(x * cellX + inset, y * cellY + inset, cellX - inset * 2, cellY - inset * 2);
      ctx.globalAlpha = 1;
    }
    if (frame.coverage[i] > 128) ctx.fillStyle = frame.colors[i] >= 91 ? 'rgba(0,0,0,.16)' : frame.colors[i] >= 83 ? 'rgba(12,35,44,.3)' : frame.colors[i] >= 59 ? 'rgba(74,27,48,.3)' : frame.colors[i] >= 45 ? 'rgba(5,22,12,.4)' : 'rgba(55,47,35,.28)';
    if (frame.chars[i] !== 32) ctx.fillText(String.fromCharCode(frame.chars[i]), (x + .5) * cellX, (y + .5) * cellY);
  }
}
function size() {
  if (!active || !ctx) return;
  width = innerWidth; height = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cellX = Math.max(3, Math.min(4, width / 320), width / 480); cellY = cellX * 1.6;
  ctx.font = `500 ${cellY * .76}px ui-monospace, Consolas, monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  background.width = canvas.width; background.height = canvas.height;
  const paper = background.getContext('2d');
  paper.fillStyle = '#000'; paper.fillRect(0, 0, background.width, background.height);
  resizePond(pond, Math.max(20, Math.ceil(width / cellX)), Math.max(12, Math.ceil(height / cellY)));
  paint();
}
function stop() { cancelAnimationFrame(raf); raf = 0; previous = 0; }
function tick(now) {
  raf = 0;
  if (!active || motion.matches || document.hidden) return;
  if (!previous) previous = now;
  if (now - previous >= 1000 / 60 - 1) {
    advance(pond, Math.min((now - previous) / 1000, .1)); previous = now; paint();
  }
  raf = requestAnimationFrame(tick);
}
function resume() {
  stop();
  if (active && !motion.matches && !document.hidden) raf = requestAnimationFrame(tick);
}
function synchronize() {
  const selected = document.documentElement.dataset.themeId === THEME_ID;
  if (selected === active) return;
  active = selected;
  if (active) { document.body.prepend(canvas); size(); resume(); }
  else { stop(); canvas.remove(); }
}
new MutationObserver(synchronize).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-id'] });
window.addEventListener('resize', size, { passive: true });
document.addEventListener('visibilitychange', resume);
motion.addEventListener('change', () => { resume(); paint(); });
const interactive = target => !(target instanceof Element) || target.closest('input,textarea,select,button,a,pre,code,[contenteditable],[role="button"],[role="link"],[role="textbox"],[role="menuitem"]');
let pointerDown = null, lastStir = 0, lastPoint = null;
window.addEventListener('pointerdown', event => {
  pointerDown = active && !motion.matches && event.button === 0 && !interactive(event.target) ? { x: event.clientX, y: event.clientY } : null;
}, { passive: true });
window.addEventListener('pointercancel', () => { pointerDown = null; }, { passive: true });
window.addEventListener('pointerup', event => {
  const down = pointerDown; pointerDown = null;
  if (!down || !active || document.hidden || motion.matches || event.button !== 0 || interactive(event.target)) return;
  if (Math.hypot(down.x - event.clientX, down.y - event.clientY) < 6) feed(pond, event.clientX / cellX, event.clientY / cellY);
}, { passive: true });
window.addEventListener('pointermove', event => {
  if (!active || document.hidden || motion.matches || interactive(event.target)) return;
  const now = performance.now(), x = event.clientX / cellX, y = event.clientY / cellY;
  if (now - lastStir < 140 || lastPoint && Math.hypot(x - lastPoint.x, (y - lastPoint.y) * pond.aspect) < 2) return;
  disturb(pond, x, y, .35); lastStir = now; lastPoint = { x, y };
}, { passive: true });
try { registerTheme(); synchronize(); } catch (error) { console.warn('Midnight Koi could not register its native theme:', error.message); }
