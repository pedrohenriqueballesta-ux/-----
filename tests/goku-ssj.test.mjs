import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FOLHAS_GOKU_BASE} from '../public/art/goku-base.mjs';
import {FOLHAS_GOKU_SSJ} from '../public/art/goku-ssj.mjs';
import {DIRECTIONS} from '../public/render/camera.mjs';
globalThis.Image=class {complete=true;naturalWidth=1024;};
const {drawGoku}=await import('../public/art/goku.mjs');
const {art}=await import('../public/art/assets.mjs');

// Super Saiyajin novo (Pedro, 11/11/2026): mesmas poses da base; só o cabelo cresce, então a folha é mais alta.
test('seis folhas Super Saiyajin com as chaves da base, grade 5×4 e âncoras nos pés',async()=>{
  assert.deepEqual(Object.keys(FOLHAS_GOKU_SSJ).sort(),Object.keys(FOLHAS_GOKU_BASE).sort());
  for(const [estado,[f,chave]] of Object.entries(FOLHAS_GOKU_SSJ)) {
    const png=await readFile(new URL('../public'+f.file,import.meta.url));
    assert.equal(f.rows,5);assert.equal(f.columns,4);assert.equal(png.readUInt32BE(16),f.width);assert.equal(png.readUInt32BE(20),f.height);
    assert.ok(art[chave],estado+': imagem registrada');
    // Cabelo de Super Saiyajin: mais alto que a base, mas no máximo ~10% (o corpo é o mesmo).
    const base=FOLHAS_GOKU_BASE[estado][0].referenceHeight;assert.ok(f.referenceHeight>=base-3&&f.referenceHeight<=base*1.1,estado);
    for(const linha of f.frames){assert.equal(linha.length,4);assert.equal(new Set(linha.map(q=>q[5]-q[1])).size,1);for(const [x,y,w,h,ax,ay] of linha)assert.ok(ax>x&&ax<x+w&&ay>y&&ay<y+h);}
  }
});
test('transformado, drawGoku usa as folhas Super Saiyajin em todas as poses e oito direções, na escala da base',()=>{
  const casos=[['parado',{},null],['andar',{moving:true},null],['soco',{},.6],['rajada',{rajadaStarted:9.9},.5],['kamehameha',{charge:{until:10.4},rajadaStarted:9.9},.5],['kamehameha',{kameStarted:9.9},null],['genki',{genkiCarga:{started:9.5,until:11.42},charge:{until:10.1}},null],['genki',{genkiLancado:9.8},null]];
  for(const jogador of [{forma:'ssj',transformed:true},{transformed:true}])for(const facing of DIRECTIONS)for(const [estado,dados,soco] of casos) {
    const desenhos=[],c={save(){},restore(){},translate(){},scale(){},drawImage(...a){desenhos.push(a);}};
    assert.ok(drawGoku(c,{...jogador,facing,...dados},{x:100,y:200,travelled:35},10,soco));
    const d=desenhos[0];assert.equal(d[0],art[FOLHAS_GOKU_SSJ[estado][1]],estado);
    assert.ok(Math.abs(d[7]/d[3]-70/FOLHAS_GOKU_BASE.andar[0].referenceHeight)<1e-9,estado+': mesma escala de pixel da base');
  }
});
