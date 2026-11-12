import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FOLHAS_GOKU_BASE} from '../public/art/goku-base.mjs';
import {FOLHAS_GOKU_SSJ3} from '../public/art/goku-ssj3.mjs';
import {DIRECTIONS} from '../public/render/camera.mjs';
globalThis.Image=class {complete=true;naturalWidth=1024;};
const {drawGoku}=await import('../public/art/goku.mjs');
const {art}=await import('../public/art/assets.mjs');
const {desenharRaiosSsj2,carregarRaiosSsj2}=await import('../public/render/raios-ssj2.mjs');
const {formaDisponivel,DANO_DA_FORMA}=await import('../public/shared/formas.mjs');
const {CONFIG}=await import('../public/shared/config.mjs');

// Super Saiyajin 2 (Pedro, 11/11/2026): folhas sobre as do SSJ (mesmo corpo, cabelo mais cheio) + raios animados à parte.
test('seis folhas SSJ3 com as chaves da base, grade 5×4 e âncoras nos pés',async()=>{
  assert.deepEqual(Object.keys(FOLHAS_GOKU_SSJ3).sort(),Object.keys(FOLHAS_GOKU_BASE).sort());
  for(const [estado,[f,chave]] of Object.entries(FOLHAS_GOKU_SSJ3)) {
    const png=await readFile(new URL('../public'+f.file,import.meta.url));
    assert.equal(f.rows,5);assert.equal(f.columns,4);assert.equal(png.readUInt32BE(16),f.width);assert.equal(png.readUInt32BE(20),f.height);
    assert.ok(art[chave],estado);
    const base=FOLHAS_GOKU_BASE[estado][0].referenceHeight;assert.ok(f.referenceHeight>=base-3&&f.referenceHeight<=base*1.1,estado);
    for(const linha of f.frames)for(const [x,y,w,h,ax,ay] of linha)assert.ok(ax>x&&ax<x+w&&ay>y&&ay<y+h);
  }
});
test('forma SSJ3 desenha as folhas SSJ3 em todas as poses e oito direções, na escala da base',()=>{
  const casos=[['parado',{},null],['andar',{moving:true},null],['soco',{},.6],['rajada',{rajadaStarted:9.9},.5],['kamehameha',{kameStarted:9.9},null],['genki',{genkiLancado:9.8},null]];
  for(const facing of DIRECTIONS)for(const [estado,dados,soco] of casos) {
    const desenhos=[],c={save(){},restore(){},translate(){},scale(){},drawImage(...a){desenhos.push(a);}};
    assert.ok(drawGoku(c,{forma:'ssj3',transformed:true,facing,...dados},{x:100,y:200,travelled:35},10,soco));
    assert.equal(desenhos[0][0],art[FOLHAS_GOKU_SSJ3[estado][1]],estado);
    assert.ok(Math.abs(desenhos[0][7]/desenhos[0][3]-70/FOLHAS_GOKU_BASE.andar[0].referenceHeight)<1e-9,estado);
  }
});
test('SSJ3: topo da escada, dano = SSJ2 × 1,5 e sem os raios do SSJ2',()=>{
  assert.equal(formaDisponivel(CONFIG.skills.ssj3).forma,'ssj3');assert.equal(formaDisponivel(CONFIG.skills.ssj3-1).forma,'ssj2');
  for(const g of ['soco','rajada','kame','genki'])assert.ok(Math.abs(DANO_DA_FORMA.ssj3[g]-DANO_DA_FORMA.ssj2[g]*1.5)<1e-9,g);
  carregarRaiosSsj2('frente');const ctx={globalAlpha:1,save(){},restore(){},drawImage(){}};
  assert.equal(desenharRaiosSsj2(ctx,{forma:'ssj3'},{x:0,y:0},1,75),false);
  assert.equal(desenharRaiosSsj2(ctx,{forma:'ssj2'},{x:0,y:0},1,75),true);
});
