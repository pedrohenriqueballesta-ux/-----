import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/nucleo/game.mjs';
import {CONFIG,lugar} from '../public/shared/nucleo/config.mjs';
import {ESTAGIOS_KAME,KAME,SUPER_KAME,estagioKame} from '../public/shared/tecnicas/kamehameha.mjs';
import {RYUKEN,danoRyuken} from '../public/shared/tecnicas/ryuken.mjs';
import {multiplicadorDaForma} from '../public/shared/tecnicas/formas.mjs';
import {FOLHAS_GOKU_SSJ4} from '../public/art/personagens/goku/goku-ssj4.mjs';
import {FOLHAS_GOKU_SSJ3} from '../public/art/personagens/goku/goku-ssj3.mjs';

// Super Saiyajin 4 (Pedro, 16/11/2026): folhas próprias; tem Kamehameha (azul, tecla 2), Ryuken (tecla 8) e
// Super Kamehameha (técnica própria, atribuível à barra, vermelho-carmesim no último nível).
function cena(level=CONFIG.skills.ssj4,dx=120){
  const g=new Game({now:1000,populate:false}),p=g.addPlayer('p','Goku',{level});
  g.levar(p,lugar('inicial'));p.x+=300;p.seguroAte=0;p.autoHeal=p.autoFood=false;
  const m=g.addMob('melee',p.x+dx,p.y);m.hp=m.maxHp=1e9;m.speed=0;m.aggro=0;p.targetId=m.id;
  return {g,p,m};
}
const passar=(g,s)=>{for(let i=0;i<Math.round(s/.05);i++)g.tick(.05);};
const ultimo=ESTAGIOS_KAME.at(-1).nivel;

test('o SSJ4 tem as seis folhas próprias, no mesmo formato e tamanho de corpo das do SSJ3',()=>{
  assert.deepEqual(Object.keys(FOLHAS_GOKU_SSJ4),Object.keys(FOLHAS_GOKU_SSJ3));
  for(const [estado,[folha,chave]] of Object.entries(FOLHAS_GOKU_SSJ4)){
    assert.equal(folha.file,`/assets/goku/ssj4/${estado}.png`);assert.equal(chave,'gokuSsj4'+estado[0].toUpperCase()+estado.slice(1));
    assert.equal(folha.rows,5);assert.equal(folha.columns,4);
    assert.ok(Math.abs(folha.referenceHeight-FOLHAS_GOKU_SSJ3[estado][0].referenceHeight)<=12,estado);
  }
});
test('no SSJ4 o Kamehameha da tecla 2 continua azul e no nível do personagem',()=>{
  const {g,p}=cena();g.cast(p,'transform');assert.equal(p.forma,'ssj4');
  assert.ok(g.cast(p,'kame').ok);assert.equal(p.charge.cor,undefined);assert.equal(p.charge.nivel,estagioKame(p.level).nivel);
});
test('Super Kamehameha: só no SSJ4, carmesim, último nível, custo/recarga/dano próprios e recarga separada do Kamehameha',()=>{
  const {g,p,m}=cena(),obs=g.addPlayer('o');g.levar(obs,lugar('inicial'));
  assert.equal(g.cast(p,'superKamehameha').ok,false,'fora do SSJ4 não sai');
  g.cast(p,'transform');assert.equal(p.forma,'ssj4');
  const ki=p.ki;assert.ok(g.cast(p,'superKamehameha').ok);assert.equal(p.ki,ki-SUPER_KAME.custo);
  assert.equal(p.charge.cor,'carmesim');assert.equal(p.charge.nivel,ultimo);
  passar(g,KAME.carga+.05);
  const k=g.snapshot(obs.id).kamehamehas.find(x=>x.owner===p.id);assert.ok(k);assert.equal(k.cor,'carmesim');assert.equal(k.nivel,ultimo);
  assert.ok(g.snapshot(p.id).self.superKameRemaining>0);assert.equal(g.snapshot(p.id).self.kameRemaining,0,'a recarga do Kamehameha é outra');
  passar(g,2);
  const def=100/(100+(m.defesa??1)*3);assert.equal(m.maxHp-m.hp,Math.round(p.stats.attack*SUPER_KAME.dano*def));
  assert.ok(SUPER_KAME.dano>multiplicadorDaForma('ssj4','kame'));
  assert.equal(g.cast(p,'superKamehameha').ok,false,'ainda em recarga');assert.ok(g.cast(p,'kame').ok,'o Kamehameha azul sai na recarga do Super');
});
test('o Super Kamehameha exige o nível 500',()=>{
  const {g,p}=cena(CONFIG.skills.superKamehameha-1);p.forma='ssj4';
  assert.equal(g.cast(p,'superKamehameha').ok,false);
});
test('o SSJ4 também solta o Ryuken, um degrau mais forte que no SSJ3',()=>{
  const {g,p,m}=cena();g.cast(p,'transform');assert.ok(g.cast(p,'ryuken').ok);assert.ok(p.ryuken);
  assert.equal(danoRyuken('ssj4'),RYUKEN.dano*1.5);
  let t=0;while(m.hp===m.maxHp&&t<4){g.tick(.05);t+=.05;}
  const def=100/(100+(m.defesa??1)*3);assert.equal(m.maxHp-m.hp,Math.round(p.stats.attack*danoRyuken('ssj4')*def));
});
test('Auto Hunt no SSJ4 começa pelo Super Kamehameha',()=>{
  const {g,p}=cena();g.cast(p,'transform');p.autoHunt=true;p.autoSkills=true;p.autoAttack=false;g.tick(.05);
  assert.ok(p.charge?.superKame,'carregando o Super Kamehameha');
});
