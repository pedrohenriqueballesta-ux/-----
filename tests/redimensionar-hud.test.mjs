import test from 'node:test';
import assert from 'node:assert/strict';
import {instalarRedimensionamento,limitarTamanhoHud,limitarAlturaHud,limitarEscalaHud,modoRedimensionamento} from '../public/render/redimensionar-hud.mjs';
test('tamanho das janelas respeita mínimos e limites da tela',()=>{
 assert.deepEqual(limitarTamanhoHud(50,40,{w:1000,h:800}),{w:220,h:160});
 assert.deepEqual(limitarTamanhoHud(5000,5000,{w:420,h:740}),{w:404,h:724});
 assert.deepEqual(limitarTamanhoHud(100,100,{w:180,h:140}),{w:164,h:124});
 assert.deepEqual(limitarTamanhoHud(NaN,Infinity,{w:1000,h:800}),{w:220,h:160});
});
test('redimensionamento livre aceita larguras e alturas independentes ou diagonais',()=>{
 assert.deepEqual(limitarTamanhoHud(420,350,{w:1000,h:800}),{w:420,h:350});
 assert.deepEqual(limitarTamanhoHud(500,260,{w:1000,h:800}),{w:500,h:260});
 assert.deepEqual(limitarTamanhoHud(340,510,{w:1000,h:800}),{w:340,h:510});
});
test('escala mantém proporção e limita HUDs à área disponível',()=>{
 assert.equal(limitarEscalaHud(5,{w:300,h:100},{w:1000,h:800}),2);
 assert.equal(limitarEscalaHud(.1,{w:300,h:100},{w:1000,h:800}),.6);
 assert.equal(limitarEscalaHud(2,{w:800,h:100},{w:420,h:740}),404/800);
 assert.equal(limitarEscalaHud(2,{w:100,h:900},{w:420,h:740}),724/900);
 assert.equal(limitarEscalaHud(NaN,{w:300,h:100},{w:1000,h:800}),1);
});
test('altura vertical respeita a tela sem alterar a largura fixa da janela',()=>{
 assert.equal(limitarAlturaHud(260,{w:1000,h:800}),260);
 assert.equal(limitarAlturaHud(5000,{w:420,h:740}),724);
 assert.equal(limitarAlturaHud(40,{w:1000,h:800}),160);
 assert.equal(limitarAlturaHud(NaN,{w:1000,h:800}),188);
});
test('janelas com eixo vertical não são forçadas ao redimensionamento livre',()=>{
 assert.equal(modoRedimensionamento({tagName:'DIALOG'},'vertical'),'vertical');
 assert.equal(modoRedimensionamento({tagName:'DIALOG'},'livre'),'janela');
 assert.equal(modoRedimensionamento({tagName:'SECTION'},'vertical'),'vertical');
});
test('arrastar a alça de uma janela redimensiona horizontal, vertical e diagonalmente',()=>{
 const nomes=['document','localStorage','innerWidth','innerHeight','addEventListener','requestAnimationFrame','MutationObserver','ResizeObserver'];
 const originais=Object.fromEntries(nomes.map(k=>[k,globalThis[k]])),gravados=new Map(),documentos={};
 try{
  globalThis.innerWidth=1200;globalThis.innerHeight=900;
  globalThis.localStorage={getItem:k=>gravados.get(k)||null,setItem:(k,v)=>gravados.set(k,v),removeItem:k=>gravados.delete(k)};
  globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=f=>f();
  globalThis.MutationObserver=class{observe(){}};globalThis.ResizeObserver=class{observe(){}};
  globalThis.document={createElement:tag=>({tagName:tag.toUpperCase(),attrs:{},events:{},classList:{add(){}},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.events[k]=f},setPointerCapture(id){this.capture=id},hasPointerCapture(id){return this.capture===id},releasePointerCapture(){this.capture=null}}),addEventListener:(k,f,capture)=>{documentos[k]=f;documentos[k+'Capture']=capture}};
  const props={},classes=new Set();let alca;
  const painel={tagName:'DIALOG',id:'mochilaDialog',open:true,style:{setProperty:(k,v)=>{props[k]=v},removeProperty:k=>{delete props[k]}},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)},matches:()=>false,getClientRects:()=>[{}],getAttribute:()=> 'Mochila',querySelector:()=>null,append:el=>{alca=el},getBoundingClientRect:()=>({left:Number.parseFloat(painel.style.left)||100,top:Number.parseFloat(painel.style.top)||80,width:Number.parseFloat(props['--hud-largura'])||380,height:Number.parseFloat(props['--hud-altura'])||470})};
  instalarRedimensionamento(painel,'mochila');
  assert.ok(alca.className.includes('hud-redimensionar')&&!alca.className.includes('vertical'));
  const arrastar=(id,dx,dy)=>{
   alca.events.pointerdown({button:0,isPrimary:true,pointerId:id,clientX:200,clientY:200,preventDefault(){},stopPropagation(){}});
   const mover=documentos.pointermove;assert.equal(documentos.pointermoveCapture,true);
   mover({pointerId:id,clientX:200+dx,clientY:200+dy,preventDefault(){},stopPropagation(){}});
   documentos.pointerup({pointerId:id,preventDefault(){},stopPropagation(){}});
  };
  arrastar(1,30,0);assert.equal(props['--hud-largura'],'410px');assert.equal(props['--hud-altura'],'470px');
  arrastar(2,0,25);assert.equal(props['--hud-largura'],'410px');assert.equal(props['--hud-altura'],'495px');
  arrastar(3,20,30);assert.equal(props['--hud-largura'],'430px');assert.equal(props['--hud-altura'],'525px');
 }finally{for(const[k,v]of Object.entries(originais))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
