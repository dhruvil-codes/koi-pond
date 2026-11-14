import { readFile, writeFile } from 'node:fs/promises'
import { coreBundle } from '../../scripts/build.mjs'
const model = await coreBundle()
const adapter = (await readFile(new URL('./backdrop-adapter.js', import.meta.url), 'utf8')).replace(/^import[^\n]*\n/gm, '')
const fixture = `
const fixtureStore = new Map([['t3code:themes:v1',JSON.stringify([{id:'existing-theme',label:'Existing',appearance:'dark',colors:{canvas:'#123456'}}])]]);
const localStorage = {getItem:k=>fixtureStore.get(k)??null,setItem:(k,v)=>fixtureStore.set(k,String(v))};
class StorageEvent extends Event { constructor(type,options){super(type);this.key=options.key;} }
const selectTheme = id => {document.documentElement.dataset.themeId=id;return true};
const setAppearance = () => true, refreshTheme = () => {}, invalidateThemeLibrary = () => {};
const fixtureMotion = new EventTarget(); fixtureMotion.matches = false;
const matchMedia = () => fixtureMotion;
let fixtureNext = 0; const fixtureFrames = new Map();
const requestAnimationFrame = fn => {const id=++fixtureNext;fixtureFrames.set(id,fn);return id};
const cancelAnimationFrame = id => fixtureFrames.delete(id);
const fixtureFrame = time => {const entry=fixtureFrames.entries().next().value;if(entry){fixtureFrames.delete(entry[0]);entry[1](time);}};
`
const assertions = `
const fixtureAssert=(v,m)=>{if(!v)throw new Error(m)};
fixtureAssert(JSON.parse(fixtureStore.get('t3code:themes:v1')).some(t=>t.id==='existing-theme'&&t.colors.canvas==='#123456'),'Existing theme was altered');
fixtureAssert(document.getElementById('midnight-koi-backdrop'),'Backdrop must mount on its theme');
fixtureAssert(getComputedStyle(canvas).pointerEvents==='none','Backdrop must not intercept application input');
fixtureFrame(100);fixtureFrame(118);fixtureFrame(136);
fixtureAssert(pond.time>0,'Animation must advance');
const fixtureArea=document.getElementById('fixture-area'), fixtureInput=document.getElementById('fixture-input');
const fixtureClick=(target,upX=110)=>{target.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:110,clientY:140}));target.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,clientX:upX,clientY:140}));};
fixtureClick(fixtureArea); fixtureAssert(pond.food.length===1,'Blank-area click should feed');
fixtureClick(fixtureInput);fixtureAssert(pond.food.length===1,'Input interaction must not feed');
fixtureClick(fixtureArea,180);fixtureAssert(pond.food.length===1,'Selecting or dragging must not feed');
fixtureMotion.matches=true;fixtureMotion.dispatchEvent(new Event('change'));
const fixturePaused=pond.time;fixtureFrame(500);fixtureAssert(pond.time===fixturePaused&&fixtureFrames.size===0,'Reduced motion must stop the frame clock');
fixtureMotion.matches=false;fixtureMotion.dispatchEvent(new Event('change'));fixtureFrame(800);fixtureFrame(818);fixtureAssert(pond.time>fixturePaused,'Motion must resume without a time jump');
document.documentElement.dataset.themeId='existing-theme';synchronize();
fixtureAssert(!document.getElementById('midnight-koi-backdrop')&&fixtureFrames.size===0,'Another theme must remove and stop the backdrop');
document.documentElement.dataset.themeId=THEME_ID;synchronize();
console.info('Native adapter fixture passed: theme preservation, mount, animation, passive canvas, control/drag filtering, reduced motion, resume, theme-switch teardown.');
`
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#000;color:#eeeadd;font:14px/1.6 system-ui}#root{height:440px}main{padding:24px}section{max-width:480px;margin:70px auto}textarea{width:100%;height:46px;color:#eeeadd;border:1px solid #30332c}pre{padding:14px}
</style></head><body><div id="root"><main data-slot="sidebar-inset"><section id="fixture-area"><p>Native backdrop integration test fixture</p><pre>Readable code surface</pre><textarea id="fixture-input" aria-label="Test composer"></textarea></section></main></div><script>(function(){${fixture}\n${model}\n${adapter}\n${assertions}})();</script></body></html>`
await writeFile(new URL('./adapter-check.html', import.meta.url), html)
console.log('Built isolated native adapter fixture; native T3 appearance still requires installation.')
