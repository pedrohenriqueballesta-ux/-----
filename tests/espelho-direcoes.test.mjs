import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {DIRECTIONS,spriteFacing} from '../public/render/camera.mjs';
import {origemKame} from '../public/shared/kamehameha.mjs';
// Imagem já carregada: o teste mede as transformações reais enviadas ao canvas.
globalThis.Image = class {complete=true;naturalWidth=1024;};
const {drawSheet,SHEET_VIEWS}=await import('../public/art/atlas.mjs');
const {drawGoku}=await import('../public/art/goku.mjs');
const {art}=await import('../public/art/assets.mjs');
const {FOLHAS_GOKU_BASE}=await import('../public/art/goku-base.mjs');
const pasta=new URL('../public/art/',import.meta.url),folhas=[];
for(const nome of await readdir(pasta)){
 const texto=await readFile(new URL(nome,pasta),'utf8');
 if(!/export const \w+ = \{\s*file:/.test(texto))continue;
 for(const folha of Object.values(await import(new URL(nome,pasta))))if(folha?.rows===5&&folha.frames)folhas.push([nome,folha]);
}
function contexto(){
 const pilha=[],desenhos=[];let m={a:1,d:1,x:0,y:0};
 return {desenhos,get matriz(){return {...m};},save(){pilha.push({...m});},restore(){m=pilha.pop();},
 translate(x,y){m.x+=m.a*x;m.y+=m.d*y;},scale(x,y){m.a*=x;m.d*=y;},drawImage(...args){desenhos.push({args,m:{...m}});}};
}
const linhas=[0,1,2,3,4,3,2,1];
for(const [nome,folha] of folhas)test(nome+': oito direções usam linha correta, espelho horizontal e âncora fixa',()=>{
 for(let dir=0;dir<8;dir++)for(let coluna=0;coluna<folha.columns;coluna++){
  const c=contexto(),pos={x:301,y:407},altura=70,ref=folha.referenceHeight;
  assert.equal(spriteFacing(DIRECTIONS[dir]),dir);
  assert.equal(SHEET_VIEWS[dir].row,linhas[dir]);assert.equal(SHEET_VIEWS[dir].flip,dir>=1&&dir<=3);
  assert.ok(drawSheet(c,folha,{complete:true,naturalWidth:folha.width},pos,altura,DIRECTIONS[dir],coluna));
  const {args,m}=c.desenhos[0],quadro=folha.frames[linhas[dir]][coluna];
  assert.deepEqual(args.slice(1,5),quadro.slice(0,4));
  assert.equal(m.a,dir>=1&&dir<=3?-1:1);assert.equal(m.d,1,'nunca inverte verticalmente');
  const xDaAncora=args[5]+(quadro[4]-quadro[0])*altura/ref;
  const yDaAncora=args[6]+(quadro[5]-quadro[1])*altura/ref;
  assert.ok(Math.abs(m.x+m.a*xDaAncora-pos.x)<1e-9);
  assert.ok(Math.abs(m.y+yDaAncora-(pos.y+6))<1e-9);
  assert.deepEqual(c.matriz,{a:1,d:1,x:0,y:0},'texto e barras ficam fora do contexto espelhado');
 }
});
test('registro cobre todas as folhas novas e as cinco direções de personagens e mobs',()=>{
 assert.ok(folhas.length>60);assert.equal(Object.keys(FOLHAS_GOKU_BASE).length,6);
 for(const [folha] of Object.values(FOLHAS_GOKU_BASE))assert.ok(folhas.some(([,f])=>f===folha));
});
test('Goku usa as folhas novas de parado, soco, rajada, carga e disparo com escala comum',()=>{
 const casos=[['parado',{},null],['soco',{},.6],['rajada',{rajadaStarted:9.9},null],
  ['kamehameha',{charge:{until:10.4}},null],['kamehameha',{kameStarted:9.9},null],['genki',{genkiCarga:{started:9.5,until:11.42},charge:{until:10.1}},null],['genki',{genkiLancado:9.8},null]];
 for(const [estado,dados,ataque] of casos){
  const c=contexto();drawGoku(c,{facing:DIRECTIONS[2],moving:false,...dados},{x:100,y:200},10,ataque);
  const d=c.desenhos[0],folha=FOLHAS_GOKU_BASE[estado][0];
  assert.equal(d.args[0],art[FOLHAS_GOKU_BASE[estado][1]]);
  assert.equal(d.m.a,-1);assert.ok(Math.abs(d.args[7]/d.args[3]-70/FOLHAS_GOKU_BASE.andar[0].referenceHeight)<1e-9);
 }
});
test('origem do Kamehameha espelha o deslocamento horizontal e mantém altura nas diagonais',()=>{
 const pos={x:100,y:200};
 for(const [esquerda,direita] of [[1,7],[2,6],[3,5]]){
  const a=DIRECTIONS[esquerda],b=DIRECTIONS[direita];
  const normalizar=d=>({x:d.x/Math.hypot(d.x,d.y),y:d.y/Math.hypot(d.x,d.y)});
  const e=origemKame(pos,normalizar(a)),d=origemKame(pos,normalizar(b));
  assert.equal(e.x-pos.x,-(d.x-pos.x));assert.equal(e.y,d.y);
 }
});
