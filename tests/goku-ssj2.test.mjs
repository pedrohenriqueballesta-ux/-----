import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FOLHAS_GOKU_BASE} from '../public/art/goku-base.mjs';
import {FOLHAS_GOKU_SSJ2} from '../public/art/goku-ssj2.mjs';
import {DIRECTIONS} from '../public/render/camera.mjs';
globalThis.Image=class {complete=true;naturalWidth=1024;};
const {drawGoku}=await import('../public/art/goku.mjs');
const {art}=await import('../public/art/assets.mjs');
const {RAIOS_SSJ2,quadroRaios,desenharRaiosSsj2,carregarRaiosSsj2}=await import('../public/render/raios-ssj2.mjs');

// Super Saiyajin 2 (Pedro, 11/11/2026): folhas sobre as do SSJ (mesmo corpo, cabelo mais cheio) + raios animados à parte.
test('seis folhas SSJ2 com as chaves da base, grade 5×4 e âncoras nos pés',async()=>{
  assert.deepEqual(Object.keys(FOLHAS_GOKU_SSJ2).sort(),Object.keys(FOLHAS_GOKU_BASE).sort());
  for(const [estado,[f,chave]] of Object.entries(FOLHAS_GOKU_SSJ2)) {
    const png=await readFile(new URL('../public'+f.file,import.meta.url));
    assert.equal(f.rows,5);assert.equal(f.columns,4);assert.equal(png.readUInt32BE(16),f.width);assert.equal(png.readUInt32BE(20),f.height);
    assert.ok(art[chave],estado);
    const base=FOLHAS_GOKU_BASE[estado][0].referenceHeight;assert.ok(f.referenceHeight>=base-3&&f.referenceHeight<=base*1.1,estado);
    for(const linha of f.frames)for(const [x,y,w,h,ax,ay] of linha)assert.ok(ax>x&&ax<x+w&&ay>y&&ay<y+h);
  }
});
test('forma SSJ2 desenha as folhas SSJ2 em todas as poses e oito direções, na escala da base',()=>{
  const casos=[['parado',{},null],['andar',{moving:true},null],['soco',{},.6],['rajada',{rajadaStarted:9.9},.5],['kamehameha',{kameStarted:9.9},null],['genki',{genkiLancado:9.8},null]];
  for(const facing of DIRECTIONS)for(const [estado,dados,soco] of casos) {
    const desenhos=[],c={save(){},restore(){},translate(){},scale(){},drawImage(...a){desenhos.push(a);}};
    assert.ok(drawGoku(c,{forma:'ssj2',transformed:true,facing,...dados},{x:100,y:200,travelled:35},10,soco));
    assert.equal(desenhos[0][0],art[FOLHAS_GOKU_SSJ2[estado][1]],estado);
    assert.ok(Math.abs(desenhos[0][7]/desenhos[0][3]-70/FOLHAS_GOKU_BASE.andar[0].referenceHeight)<1e-9,estado);
  }
});
test('raios: 16 quadros em loop a 90 ms, só na forma SSJ2, ancorados nos pés e escalados pela altura',async()=>{
  const png=await readFile(new URL('../public'+RAIOS_SSJ2.camadas.frente,import.meta.url));
  assert.equal(png.readUInt32BE(16),RAIOS_SSJ2.largura*RAIOS_SSJ2.colunas);assert.equal(png.readUInt32BE(20),RAIOS_SSJ2.altura*Math.ceil(RAIOS_SSJ2.quadros/RAIOS_SSJ2.colunas));
  assert.equal(quadroRaios(0),0);assert.equal(quadroRaios(0.091),1);assert.equal(quadroRaios(16*0.09+0.001),0);
  carregarRaiosSsj2('frente');assert.equal(carregarRaiosSsj2('atras'),null);
  const chamadas=[],ctx={globalAlpha:1,save(){},restore(){},drawImage(...a){chamadas.push(a);}};
  for(const forma of ['base','kaioken','ssj'])assert.equal(desenharRaiosSsj2(ctx,{forma},{x:0,y:0},1,75),false,forma);
  assert.equal(desenharRaiosSsj2(ctx,{forma:'ssj2',dead:true},{x:0,y:0},1,75),false);
  assert.equal(desenharRaiosSsj2(ctx,{forma:'ssj2'},{x:300,y:400},1,75),true);
  assert.equal(desenharRaiosSsj2(ctx,{forma:'ssj2'},{x:300,y:400},1,75,'atras'),false,'sem camada de trás por enquanto');
  const e=75/RAIOS_SSJ2.alturaNoMolde,a=chamadas[0];
  assert.ok(Math.abs(a[5]+RAIOS_SSJ2.pesX*e-300)<1e-9);assert.ok(Math.abs(a[6]+RAIOS_SSJ2.pesY*e-400)<1e-9);
});
