import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ORIGEM_V1, desenharOrigemGalickV1 } from '../public/render/vfx/galick-origem-v1.mjs';

test('a folha V1 candidata tem 16 células RGBA e conserva a âncora do pacote', () => {
  const png=readFileSync(new URL('../public/assets/skills/galick-gun/origem-v1/spritesheet.png',import.meta.url));
  const config=JSON.parse(readFileSync(new URL('../public/assets/skills/galick-gun/origem-v1/config_origem.json',import.meta.url)));
  assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)], [4*ORIGEM_V1.largura,4*ORIGEM_V1.altura]);
  assert.equal(png[25],6);
  assert.deepEqual(config.emission_anchor_px,[ORIGEM_V1.ancoraX,ORIGEM_V1.ancoraY]);
  assert.equal(config.frames.length,16);
  for(const quadro of config.frames)assert.deepEqual(quadro.emission_anchor_px,config.emission_anchor_px);
});

test('os 16 frames mantêm a emissão sobre a mão nas oito direções e três distâncias', () => {
  const imagem={complete:true,naturalWidth:3072,naturalHeight:1024};
  const chamadas=[];
  const ctx={save(){},restore(){},set imageSmoothingEnabled(_){},
    translate(...args){chamadas.push(['translate',...args]);},
    rotate(...args){chamadas.push(['rotate',...args]);},
    drawImage(...args){chamadas.push(['draw',...args]);}};
  const direcoes=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
  for(const [dx,dy] of direcoes)for(const distancia of [32,180,384])for(let frame=0;frame<16;frame++){
    chamadas.length=0;
    const mao={x:300+dx*distancia/10,y:300+dy*distancia/10};
    assert.equal(desenharOrigemGalickV1(ctx,imagem,mao,{x:dx,y:dy},frame),true);
    const translacao=chamadas.find(c=>c[0]==='translate');
    const desenho=chamadas.find(c=>c[0]==='draw');
    assert.deepEqual(translacao,['translate',mao.x,mao.y]);
    assert.equal(desenho[2],frame%4*768);
    assert.equal(desenho[3],Math.floor(frame/4)*256);
    assert.equal(desenho[6],-170*ORIGEM_V1.escala);
    assert.equal(desenho[7],-128*ORIGEM_V1.escala);
    assert.ok(desenho[2]+desenho[4]<=imagem.naturalWidth);
    assert.ok(desenho[3]+desenho[5]<=imagem.naturalHeight);
  }
});
