import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {CONFIG,lugar} from '../public/shared/config.mjs';
import {ESTAGIOS_KAME,KAME,corDoKame,nivelDoKame} from '../public/shared/kamehameha.mjs';
import {FOLHAS_GOKU_SSJ4} from '../public/art/goku-ssj4.mjs';
import {FOLHAS_GOKU_SSJ3} from '../public/art/goku-ssj3.mjs';

// Super Saiyajin 4 (Pedro, 16/11/2026): folhas próprias e Kamehameha do último nível em vermelho-carmesim.
function cena(level){
  const g=new Game({now:1000,populate:false}),p=g.addPlayer('p','Goku',{level});
  g.levar(p,lugar('inicial'));p.x+=300;p.seguroAte=0;p.autoHeal=p.autoFood=false;
  const m=g.addMob('melee',p.x+120,p.y);m.hp=m.maxHp=1e7;m.speed=0;m.aggro=0;p.targetId=m.id;
  return {g,p};
}
const passar=(g,s)=>{for(let i=0;i<Math.round(s/.05);i++)g.tick(.05);};

test('o SSJ4 tem as seis folhas próprias, no mesmo formato e tamanho de corpo das do SSJ3',()=>{
  assert.deepEqual(Object.keys(FOLHAS_GOKU_SSJ4),Object.keys(FOLHAS_GOKU_SSJ3));
  for(const [estado,[folha,chave]] of Object.entries(FOLHAS_GOKU_SSJ4)){
    assert.equal(folha.file,`/assets/goku/ssj4/${estado}.png`);assert.equal(chave,'gokuSsj4'+estado[0].toUpperCase()+estado.slice(1));
    assert.equal(folha.rows,5);assert.equal(folha.columns,4);
    assert.ok(Math.abs(folha.referenceHeight-FOLHAS_GOKU_SSJ3[estado][0].referenceHeight)<=12,estado);
  }
});
test('no SSJ4 o Kamehameha sai carmesim e no último nível; nas outras formas continua azul',()=>{
  const ultimo=ESTAGIOS_KAME.at(-1).nivel;
  assert.equal(corDoKame('ssj4'),'carmesim');assert.equal(corDoKame('ssj3'),null);assert.equal(corDoKame('base'),null);
  assert.equal(nivelDoKame(40,'ssj4'),ultimo);assert.equal(nivelDoKame(40,'base'),ESTAGIOS_KAME[0].nivel);
  const {g,p}=cena(CONFIG.skills.ssj4),obs=g.addPlayer('o');g.levar(obs,lugar('inicial'));
  g.cast(p,'transform');assert.equal(p.forma,'ssj4');
  assert.ok(g.cast(p,'kame').ok);assert.equal(p.charge.cor,'carmesim');assert.equal(p.charge.nivel,ultimo);
  passar(g,KAME.carga+.05);
  const k=g.snapshot(obs.id).kamehamehas.find(x=>x.owner===p.id);assert.ok(k);assert.equal(k.cor,'carmesim');assert.equal(k.nivel,ultimo);
  const {g:g2,p:p2}=cena(CONFIG.skills.ssj3);g2.cast(p2,'transform');assert.equal(p2.forma,'ssj3');
  assert.ok(g2.cast(p2,'kame').ok);assert.equal(p2.charge.cor,null);
});
