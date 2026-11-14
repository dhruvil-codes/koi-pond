import { readFile, writeFile } from 'node:fs/promises'

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const checks = `<script>
(() => {
  const assert = (value, message) => { if (!value) throw Error(message) };
  const element = document.getElementById('pond'), pond = element.pond, canvas = element.shadowRoot.querySelector('canvas');
  assert(pond, 'Custom element mounts');
  const rect = canvas.getBoundingClientRect();
  const pointer = (type, extra = {}) => canvas.dispatchEvent(new PointerEvent(type, {pointerId:1,pointerType:'mouse',isPrimary:true,button:0,clientX:rect.left+rect.width*.5,clientY:rect.top+rect.height*.5,...extra}));
  const start = pond.getState().foodCount;
  pointer('pointerdown');pointer('pointerup');
  assert(pond.getState().foodCount===start+1,'Primary tap feeds');
  pointer('pointerdown');pointer('pointermove',{clientX:rect.left+rect.width*.7});pointer('pointerup');
  assert(pond.getState().foodCount===start+1,'Returned drag does not feed');
  pointer('pointerdown',{pointerType:'touch'});pointer('pointermove',{pointerType:'touch',clientY:rect.top+rect.height*.8});pointer('pointercancel');pointer('pointerup');
  pointer('pointerdown',{button:2});pointer('pointerup',{button:2});
  assert(pond.getState().foodCount===start+1,'Scroll/cancel/secondary click does not feed');
  const initialPaused=pond.getState().paused;document.getElementById('pause').click();
  assert(pond.getState().paused!==initialPaused,'Pause button');
  canvas.dispatchEvent(new KeyboardEvent('keydown',{key:' ',cancelable:true}));
  assert(pond.getState().paused===initialPaused,'Keyboard pause');
  canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',cancelable:true}));
  canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',cancelable:true}));
  assert(pond.getState().foodCount===start+2,'Keyboard feeding');
  for(const id of ['rain','dusk','midnight']){
    document.querySelector('[data-environment="'+id+'"]').click();
    assert(pond.getState().environment===id,'Environment '+id);
    assert(pond.getState().foodCount===start+2,'Environment preserves food');
  }
  const fish=document.getElementById('fish');fish.value=1;fish.dispatchEvent(new Event('input'));
  fish.value=16;fish.dispatchEvent(new Event('input'));assert(pond.getState().fishCount===16,'Population control and regrowth');
  const speed=document.getElementById('speed');speed.value=2;speed.dispatchEvent(new Event('input'));assert(pond.getState().speed===2,'Speed control');
  const lotus=document.getElementById('lotus');lotus.checked=false;lotus.dispatchEvent(new Event('change'));assert(!pond.getState().lotus,'Plant control');
  document.getElementById('reset').click();assert(pond.getState().foodCount===0&&pond.getState().speed===2,'Reset preserves settings');
  assert(pond.exportPNG().length>1000,'PNG contains rendered artwork');
  let errors=0;element.addEventListener('ponderror',()=>errors++);
  element.setAttribute('speed','invalid');assert(errors===1&&pond.getState().speed===2,'Invalid attributes are rejected');
  element.setAttribute('speed','1.35');assert(pond.getState().speed===1.35,'Valid attribute recovers');
  const other=document.createElement('koi-pond');other.style.height='120px';other.setAttribute('paused','true');document.body.append(other);
  assert(other.pond&&other.pond.getState().foodCount===0,'Independent element mounts');
  const original=other.pond;other.remove();assert(original.getState().destroyed&&other.pond===null,'Disconnect destroys controller');
  document.body.append(other);assert(other.pond&&!other.pond.getState().destroyed,'Reconnect starts a fresh controller');other.remove();
  const invalid=document.createElement('koi-pond');invalid.setAttribute('speed','invalid');document.body.append(invalid);
  assert(!invalid.pond,'Invalid initial settings do not mount');invalid.setAttribute('speed','1');assert(invalid.pond,'Fixing initial settings mounts the pond');invalid.remove();
  KoiPond.registerKoiPond('small-koi-pond');KoiPond.registerKoiPond('small-koi-pond');
  const alias=document.createElement('small-koi-pond');alias.setAttribute('paused','true');document.body.append(alias);assert(alias.pond,'Custom tag alias');alias.remove();
  pond.setOptions({environment:'rain',speed:1.35,fishCount:7,lotus:true,paused:true});
  assert(canvas.getAttribute('aria-label').includes('Paused'),'Accessible state');
  assert(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');
  console.info('Browser checks passed: tap/drag/touch filtering, keyboard, all controls, state preservation, image export, invalid attributes, independent elements, reconnect, alias registration, accessibility and layout.');
})();
</script>`
await writeFile(new URL('../test/browser-check.html', import.meta.url), html.replace('</body>', checks + '</body>'))
console.log('Built test/browser-check.html for browser verification.')
