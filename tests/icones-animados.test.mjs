import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {removerFundoEscuro,instalarIconesAnimados} from '../public/render/icones-animados.mjs';
import {decodificarGif} from '../public/render/gif-quadros.mjs';
test('remove apenas fundo escuro conectado à borda, preservando preto interno e cor da arte',()=>{
 const w=5,h=5,p=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)p.set([4,2,0,255],i*4);
 for(let y=1;y<4;y++)for(let x=1;x<4;x++)if(x===1||x===3||y===1||y===3)p.set([220,160,20,255],(y*w+x)*4);
 removerFundoEscuro(p,w,h);assert.equal(p[3],0);assert.equal(p[(2*w+2)*4+3],255);assert.equal(p[(1*w+1)*4+3],255);assert.deepEqual([...p.slice((1*w+1)*4,(1*w+1)*4+3)],[220,160,20]);
});
test('fundo já transparente não altera pixels coloridos',()=>{
 const p=new Uint8ClampedArray([0,0,0,0,40,30,20,255]);removerFundoEscuro(p,2,1);assert.deepEqual([...p],[0,0,0,0,40,30,20,255]);
});
test('remove as faixas marrons do fundo da Store sem apagar o contorno interno',()=>{
 const w=5,h=5,p=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)p.set([x===0?4:28,11,1,255],(y*w+x)*4);
 for(let y=1;y<4;y++)for(let x=1;x<4;x++)if(x===1||x===3||y===1||y===3)p.set([220,160,20,255],(y*w+x)*4);
 removerFundoEscuro(p,w,h);
 assert.equal(p[(2*w+0)*4+3],0);
 assert.equal(p[(2*w+4)*4+3],0);
 assert.equal(p[(2*w+2)*4+3],255);
});
test('preserva contorno escuro ligado à borda quando a cor difere do fundo',()=>{
 const w=7,h=7,p=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<w*h;i++)p.set([4,2,0,255],i*4);
 for(let y=0;y<h;y++)p.set([28,11,1,255],(y*w+w-1)*4);
 for(let y=0;y<4;y++)p.set([20,8,1,255],(y*w+3)*4);
 removerFundoEscuro(p,w,h);
 assert.equal(p[3],0);
 assert.equal(p[((h-1)*w+w-1)*4+3],0);
 assert.equal(p[(3*w+3)*4+3],255);
});
test('Store e Battle Pass mantêm nove quadros distintos e os tempos originais',()=>{
 for(const nome of ['store','battle-pass']){
  const gif=decodificarGif(readFileSync(new URL(`../public/assets/premium/${nome}.gif`,import.meta.url)));
  assert.equal(gif.frames.length,9);
  assert.ok(gif.frames.every(f=>f.duracao>=100));
  assert.notDeepEqual(gif.frames[0].rgba,gif.frames[1].rgba);
 }
});
test('todos os quadros ficam sem fundo escuro na borda',()=>{
 for(const nome of ['store','battle-pass']){
  const gif=decodificarGif(readFileSync(new URL(`../public/assets/premium/${nome}.gif`,import.meta.url)));
  for(const frame of gif.frames){
   const pixels=removerFundoEscuro(frame.rgba,gif.largura,gif.altura);
   const conferir=i=>{const p=i*4;assert.ok(!pixels[p+3]||Math.max(pixels[p],pixels[p+1],pixels[p+2])>32,`${nome}: fundo escuro na borda`);};
   for(let x=0;x<gif.largura;x++){conferir(x);conferir((gif.altura-1)*gif.largura+x);}
   for(let y=0;y<gif.altura;y++){conferir(y*gif.largura);conferir(y*gif.largura+gif.largura-1);}
  }
 }
});
test('sem ImageDecoder, alterna quadros transparentes em vez de congelar o GIF',async()=>{
 const orig={document:globalThis.document,location:globalThis.location,fetch:globalThis.fetch,ImageDecoder:globalThis.ImageDecoder,MutationObserver:globalThis.MutationObserver,requestAnimationFrame:globalThis.requestAnimationFrame,devicePixelRatio:globalThis.devicePixelRatio};
 const arquivo=readFileSync(new URL('../public/assets/premium/store.gif',import.meta.url));
 let quadro,canvas;const desenhados=[];
 const img={src:'http://localhost/assets/premium/store.gif',alt:'',className:'hud-ico',isConnected:true,getBoundingClientRect:()=>({width:50}),
  replaceWith(el){canvas=el;el.isConnected=true;}};
 img.classList={add(nome){img.className+=' '+nome;}};
 const ctx={createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){},clearRect(){},drawImage(fonte){desenhados.push(fonte);}};
 globalThis.document={hidden:false,querySelectorAll(){return [img];},createElement(){return {dataset:{},setAttribute(){},getContext(){return ctx;},getClientRects(){return [1];}}},addEventListener(){}};
 globalThis.location={href:'http://localhost/'};
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>arquivo.buffer.slice(arquivo.byteOffset,arquivo.byteOffset+arquivo.byteLength)});
 globalThis.ImageDecoder=undefined;
 globalThis.devicePixelRatio=2;
 globalThis.MutationObserver=class{observe(){}};
 globalThis.requestAnimationFrame=cb=>{quadro=cb;return 1;};
 try{
  instalarIconesAnimados();await new Promise(setImmediate);
  assert.ok(canvas);assert.equal(canvas.dataset.iconeAnimado,'store.gif');
  assert.equal(canvas.width,100);assert.equal(canvas.height,97);
  quadro(0);quadro(140);
  assert.notEqual(desenhados.at(-2),desenhados.at(-1));
 }finally{Object.assign(globalThis,orig);}
});
