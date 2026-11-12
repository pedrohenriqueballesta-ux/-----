import test from 'node:test';
import assert from 'node:assert/strict';
import {instalarRedimensionamento,limitarTamanhoHud,limitarAlturaHud,limitarEscalaHud,modoRedimensionamento} from '../public/render/redimensionar-hud.mjs';
test('tamanho das janelas respeita mínimos e limites da tela',()=>{
 assert.deepEqual(limitarTamanhoHud(50,40,{w:1000,h:800}),{w:220,h:160});
 assert.deepEqual(limitarTamanhoHud(5000,5000,{w:420,h:740}),{w:404,h:724});
 assert.deepEqual(limitarTamanhoHud(100,100,{w:180,h:140}),{w:164,h:124});
 assert.deepEqual(limitarTamanhoHud(NaN,Infinity,{w:1000,h:800}),{w:220,h:160});
});
test('escala mantém proporção e limita HUDs à área disponível',()=>{
 assert.equal(limitarEscalaHud(5,{w:300,h:100},{w:1000,h:800}),2);
 assert.equal(limitarEscalaHud(.1,{w:300,h:100},{w:1000,h:800}),.6);
 assert.equal(limitarEscalaHud(2,{w:800,h:100},{w:420,h:740}),404/800);
 assert.equal(limitarEscalaHud(2,{w:100,h:900},{w:420,h:740}),724/900);
 assert.equal(limitarEscalaHud(NaN,{w:300,h:100},{w:1000,h:800}),1);
});
test('escala da mochila cresce em passos e conserva o mínimo legível dentro da tela',()=>{
 assert.equal(limitarEscalaHud(1.13,{w:300,h:200},{w:1000,h:800},1,.05),1.15);
 assert.equal(limitarEscalaHud(.8,{w:300,h:200},{w:1000,h:800},1,.05),1);
 assert.equal(limitarEscalaHud(1.2,{w:390,h:500},{w:420,h:740},1,.05),1,'não passa da borda da tela');
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
 assert.equal(modoRedimensionamento({tagName:'DIALOG'},'grade'),'grade');
});
test('arrastar a alça da mochila aumenta horizontal, vertical ou diagonal em passos fixos',()=>{
 const nomes=['document','localStorage','innerWidth','innerHeight','addEventListener','requestAnimationFrame','MutationObserver','ResizeObserver'];
 const originais=Object.fromEntries(nomes.map(k=>[k,globalThis[k]])),gravados=new Map(),documentos={};
 try{
  globalThis.innerWidth=1200;globalThis.innerHeight=900;
  globalThis.localStorage={getItem:k=>gravados.get(k)||null,setItem:(k,v)=>gravados.set(k,v),removeItem:k=>gravados.delete(k)};
  globalThis.addEventListener=()=>{};globalThis.requestAnimationFrame=f=>f();
  globalThis.MutationObserver=class{observe(){}};globalThis.ResizeObserver=class{observe(){}};
  globalThis.document={createElement:tag=>({tagName:tag.toUpperCase(),attrs:{},events:{},classList:{add(){}},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.events[k]=f},setPointerCapture(id){this.capture=id},hasPointerCapture(id){return this.capture===id},releasePointerCapture(){this.capture=null}}),addEventListener:(k,f,capture)=>{documentos[k]=f;documentos[k+'Capture']=capture}};
  let alca;const painel={tagName:'DIALOG',id:'mochilaDialog',open:true,style:{scale:''},classList:{add(){},remove(){}},matches:()=>false,getClientRects:()=>[{}],getAttribute:()=> 'Mochila',querySelector:()=>null,append:el=>{alca=el},getBoundingClientRect:()=>({left:Number.parseFloat(painel.style.left)||100,top:Number.parseFloat(painel.style.top)||80,width:380*(Number(painel.style.scale)||1),height:470*(Number(painel.style.scale)||1)})};
  instalarRedimensionamento(painel,'mochila',{eixo:'grade'});
  assert.ok(alca.className.includes('hud-redimensionar')&&!alca.className.includes('vertical'));
  const arrastar=(id,dx,dy)=>{
   alca.events.pointerdown({button:0,isPrimary:true,pointerId:id,clientX:200,clientY:200,preventDefault(){},stopPropagation(){}});
   const mover=documentos.pointermove;assert.equal(documentos.pointermoveCapture,true);
   mover({pointerId:id,clientX:200+dx,clientY:200+dy,preventDefault(){},stopPropagation(){}});
   documentos.pointerup({pointerId:id,preventDefault(){},stopPropagation(){}});
  };
  arrastar(1,100,0);assert.equal(painel.style.scale,'1.1','arrasto horizontal avança um passo');
  arrastar(2,0,100);assert.equal(painel.style.scale,'1.25','arrasto vertical avança em passos');
  arrastar(3,50,50);assert.equal(painel.style.scale,'1.35','arrasto diagonal também avança em passos');
  arrastar(4,-300,-300);assert.equal(painel.style.scale,'1','não diminui abaixo do tamanho legível');
 }finally{for(const[k,v]of Object.entries(originais))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
