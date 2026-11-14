import { readFile, writeFile } from 'node:fs/promises'

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const checks = `<script>
(() => {
  const assert=(value,message)=>{if(!value)throw Error(message)};
  const canvas=document.getElementById('pond'),pond=canvas.pond;
  assert(pond,'Playground mounts');
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const config=()=>pond.getConfig();
  const optionsFromCode=()=>{const text=document.getElementById('embed-code').textContent;const start=text.indexOf('const config = ')+15;return JSON.parse(text.slice(start,text.indexOf(';',start)))};
  const input=(id,value,type='input')=>{const node=document.getElementById(id);node.value=value;node.dispatchEvent(new Event(type,{bubbles:true}))};
  const rect=canvas.getBoundingClientRect();
  const pointer=(type,extra={})=>canvas.dispatchEvent(new PointerEvent(type,{pointerId:1,pointerType:'mouse',isPrimary:true,button:0,clientX:rect.left+rect.width*.5,clientY:rect.top+rect.height*.5,...extra}));
  pointer('pointerdown');pointer('pointerup');assert(pond.getState().foodCount===1,'Tap feeds');
  pointer('pointerdown');pointer('pointermove',{clientX:rect.left+rect.width*.7});pointer('pointerup');
  pointer('pointerdown',{pointerType:'touch'});pointer('pointermove',{pointerType:'touch',clientY:rect.top+rect.height*.8});pointer('pointercancel');pointer('pointerup');
  pointer('pointerdown',{button:2});pointer('pointerup',{button:2});assert(pond.getState().foodCount===1,'Drag, scroll, cancellation and secondary clicks do not feed');
  const paused=config().paused;document.getElementById('pause').click();assert(config().paused!==paused,'Pause control');
  canvas.dispatchEvent(new KeyboardEvent('keydown',{key:' ',cancelable:true}));assert(config().paused===paused,'Keyboard pause');
  canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',cancelable:true}));canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',cancelable:true}));assert(pond.getState().foodCount===2,'Keyboard feed');
  input('fish',30);input('speed',3);input('fish-size',1.8);input('behavior','school','change');
  assert(config().fishCount===30&&config().speed===3&&config().fishSize===1.8&&config().behavior==='school','All fish controls');
  for(const box of document.querySelectorAll('[name=variety]')){box.checked=box.value==='shusui';box.dispatchEvent(new Event('change'))}
  assert(equal(config().varieties,['shusui']),'Fish variety selection');
  const last=document.querySelector('[name=variety]:checked');last.checked=false;last.dispatchEvent(new Event('change'));assert(last.checked&&config().varieties.length===1,'At least one variety stays selected');
  const fishSettings={fishCount:config().fishCount,speed:config().speed,fishSize:config().fishSize,varieties:config().varieties,behavior:config().behavior,seed:config().seed};
  for(const id of ['zen','moonlight','autumn','sakura']){
    document.querySelector('[data-environment="'+id+'"]').click();assert(config().environment===id,'Environment '+id);
    for(const [key,value] of Object.entries(fishSettings))assert(equal(config()[key],value),'Environment preserves '+key);
    assert(pond.getState().foodCount===2,'Environment preserves food');
  }
  document.querySelector('[data-panel=water]').click();assert(!document.getElementById('panel-water').hidden,'Water inspector tab');
  input('water-color','#275b69');input('lily-density',0);input('lotus-count',6);input('ripple-intensity',2);
  assert(config().waterColor==='#275b69'&&config().lilyDensity===0&&config().lotusCount===6&&config().rippleIntensity===2,'Water and plant controls');
  document.getElementById('preset-water').click();assert(config().waterColor===null,'Preset water restores');
  document.querySelector('[data-panel=atmosphere]').click();input('particle-density',1);input('time-of-day','18','change');input('seed',42,'change');input('detail','balanced','change');
  assert(config().particleDensity===1&&config().timeOfDay===18&&config().seed===42&&config().detail==='balanced','Atmosphere controls');
  for(const target of ['javascript','html','react','next']){
    document.querySelector('[data-target="'+target+'"]').click();assert(equal(optionsFromCode(),config()),target+' code reflects every setting exactly');
  }
  let copies=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copies.push(text)}}});
  document.getElementById('copy-install').click();assert(copies.at(-1).includes('#v0.2.0'),'Real versioned npm command');
  document.getElementById('copy-code').click();assert(copies.at(-1).includes("'use client'"),'Copy chosen integration target');
  document.getElementById('copy-json').click();assert(equal(KoiPond.parseConfig(copies.at(-1)),config()),'Copy JSON exact');
  document.getElementById('share').click();const shared=new URL(copies.at(-1));assert(equal(KoiPond.parseConfig(new URLSearchParams(shared.hash.slice(1)).get('pond')),config()),'Shared URL exact');
  const before=JSON.stringify(config());input('import-config','{');document.getElementById('apply-config').click();assert(JSON.stringify(config())===before,'Invalid import atomic');
  const imported=KoiPond.randomizeConfig(987);input('import-config',KoiPond.serializeConfig(imported));document.getElementById('apply-config').click();assert(equal(config(),imported),'Valid import exact');
  document.getElementById('randomize').click();assert(config().seed!==987,'Randomize changes scene');
  document.getElementById('reset').click();assert(equal(config(),KoiPond.validateOptions()),'Reset to defaults');
  const other=document.createElement('koi-pond');other.style.height='100px';other.setAttribute('paused','true');other.setAttribute('varieties','ogon,shusui');other.setAttribute('lotus-count','4');document.body.append(other);
  assert(other.pond&&equal(other.pond.getConfig().varieties,['ogon','shusui'])&&other.pond.getConfig().lotusCount===4,'Custom element accepts full settings');
  const original=other.pond;other.remove();assert(original.getState().destroyed,'Disconnect releases controller');document.body.append(other);assert(other.pond&&!other.pond.getState().destroyed,'Reconnect');other.remove();
  assert(pond.exportPNG().length>1000,'PNG has rendered artwork');
  document.querySelector('[data-panel=fish]').click();document.querySelector('[data-target=javascript]').click();
  assert(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');
  console.info('Playground browser checks passed: every live control, environment invariants, tap/drag/touch/keyboard, exact JS/HTML/React/Next outputs, clipboard/share/import, randomize/default reset, custom elements/reconnect and responsive layout.');
})();
</script>`
await writeFile(new URL('../test/browser-check.html', import.meta.url), html.replace('</body>', checks + '</body>'))
console.log('Built test/browser-check.html for actual browser verification.')
