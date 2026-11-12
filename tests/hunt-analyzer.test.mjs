import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../public/shared/game.mjs';
import {registrar,resumo,agruparLootPorRaridade} from '../public/shared/hunt-analyzer.mjs';
import {CONFIG} from '../public/shared/config.mjs';
const indexHtml=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
function cena(){const g=new Game({now:1000,populate:false});const p=g.addPlayer('p');Object.assign(p,{planet:'namek',area:'inicial',x:1500,y:1500,autoHunt:true,autoFood:false,autoHeal:false,autoAttack:false,autoSkills:false,seguroAte:0});return {g,p};}
test('sessão conta tempo ativo, pausa, não acumula offline e calcula XP/h',()=>{
 const {p}=cena();registrar(p,'segundos',1800);registrar(p,'xp',100);assert.equal(resumo(p).xpHora,200);
 p.autoHunt=false;registrar(p,'segundos',50);registrar(p,'xp',30);assert.equal(resumo(p).segundos,1800);assert.equal(resumo(p).xp,100);
 p.autoHunt=true;p.connected=false;registrar(p,'segundos',100);assert.equal(resumo(p).segundos,1800);
 p.connected=true;p.hp=0;registrar(p,'segundos',20);assert.equal(resumo(p).segundos,1800);
});
test('supplies contam uma vez por uso confirmado e lucro usa os preços do NPC',()=>{
 const {g,p}=cena();p.inventory.ki=2;p.ki=0;assert.equal(g.usePotion(p).ok,true);g.usePotion(p);
 let a=resumo(p);assert.equal(a.supplies[0].quantidade,1);assert.equal(a.gastos,CONFIG.prices.ki);
 registrar(p,'loot',2,'scrap');registrar(p,'zeni',30);a=resumo(p);assert.equal(a.valorLoot,16);assert.equal(a.saldo,46-CONFIG.prices.ki);
 assert.equal(p.inventory.ki,1);assert.equal(a.loot[0].raridade,'Não definida');
});
test('Loot Tracker agrupa itens por raridade e sinaliza os itens sem classificação',()=>{
 const grupos=agruparLootPorRaridade([
  {id:'sucata',nome:'Sucata',raridade:'Comum'},
  {id:'cristal',nome:'Cristal',raridade:'Raro'},
  {id:'semente',nome:'Semente',raridade:''},
  {id:'outro',nome:'Outro'}
 ]);
 assert.deepEqual(Object.keys(grupos).sort(),['Comum','Não definida','Raro']);
 assert.equal(grupos.Comum[0].id,'sucata');assert.equal(grupos['Não definida'].length,2);assert.equal(grupos.Raro[0].id,'cristal');
 assert.deepEqual(Object.keys(agruparLootPorRaridade([])),[]);
});
test('Loot Tracker registra o item assim que cai do mob, antes de ser recolhido',()=>{
 const {g,p}=cena();g.random=()=>0;const mob=g.addMob('saibaman',p.x,p.y,'inicial');mob.hp=1;g.hit(p,mob,100000);
 const a=resumo(p);assert.deepEqual(a.drops.map(i=>i.id),['crystal','seed15']);assert.equal(a.drops.reduce((n,i)=>n+i.quantidade,0),2);assert.equal(a.loot.length,0);
});
test('Loot Tracker não conta drops de abates feitos fora da Auto Hunt',()=>{
 const {g,p}=cena();p.autoHunt=false;g.random=()=>0;const mob=g.addMob('saibaman',p.x,p.y,'inicial');mob.hp=1;g.hit(p,mob,100000);
 assert.equal(resumo(p).drops.length,0);
});
test('Loot Tracker abre fora do painel Auto Hunt e tem cabeçalho móvel e botão próprio para fechar',()=>{
 const inicioAuto=indexHtml.indexOf('<dialog id="autoHuntDialog"'),fimAuto=indexHtml.indexOf('</dialog>',inicioAuto);
 const abrir=indexHtml.indexOf('id="lootTrackerOpen"'),janela=indexHtml.indexOf('<section id="lootTrackerWindow"'),fechar=indexHtml.indexOf('id="lootTrackerClose"');
 assert.ok(abrir>inicioAuto&&abrir<fimAuto);assert.ok(janela>fimAuto);assert.ok(fechar>janela);
 assert.match(indexHtml.slice(janela,fechar),/<header>/);
});
test('cura conta só HP recuperado, sem duplicar falhas e desconta a semente correta',()=>{
 const {g,p}=cena();p.hp=p.stats.hp-1;p.inventory.seed15=2;g.useSeed(p,15);g.useSeed(p,15);
 const a=resumo(p);assert.equal(a.cura,1);assert.equal(a.supplies[0].id,'seed15');assert.equal(a.supplies[0].quantidade,1);
});
test('dano causado não inclui overkill e snapshot é privado por personagem',()=>{
 const {g,p}=cena();const m=g.addMob('saibaman',p.x,p.y,'inicial');m.hp=3;g.hit(p,m,100000);
 assert.equal(resumo(p).danoCausado,3);assert.equal(resumo(p).xp,m.xp);assert.ok(resumo(p).zeni>0);
 const outro=g.addPlayer('outro');assert.equal(g.snapshot(outro.id).self.huntAnalyzer.xp,0);assert.equal(g.snapshot(p.id).self.huntAnalyzer.xp,m.xp);
});
test('reset limpa análise sem mudar estoque, HP ou dinheiro; God Mode fica identificado',()=>{
 const {g,p}=cena();p.godmode=true;registrar(p,'segundos',4);registrar(p,'xp',5);registrar(p,'drops',1,'crystal');assert.equal(resumo(p).teste,true);
 const antes=[p.hp,p.zeni,JSON.stringify(p.inventory)];assert.equal(g.action(p.id,{type:'huntAnalyzerReset'}).ok,true);
 assert.equal(resumo(p).xp,0);assert.equal(resumo(p).segundos,0);assert.equal(resumo(p).drops.length,0);assert.deepEqual([p.hp,p.zeni,JSON.stringify(p.inventory)],antes);
});
test('abates agrupam monstros e chefes sem duplicar golpes em corpos mortos',()=>{
 const {g,p}=cena();
 for(let i=0;i<2;i++){const m=g.addMob('saibaman',p.x,p.y,'inicial');m.hp=1;g.hit(p,m,100000);g.hit(p,m,100000);}
 const boss=g.addMob('saibaman',p.x,p.y,'inicial');boss.raro=true;boss.name='Chefe de teste';boss.hp=1;g.hit(p,boss,100000);
 const a=resumo(p);assert.equal(a.totalAbates,3);assert.equal(a.abates.length,2);assert.equal(a.abates.find(i=>i.chefe).quantidade,1);assert.equal(a.abates.find(i=>!i.chefe).quantidade,2);
});
test('morte registra o autor do golpe fatal antes de desligar a caça e preserva totais',()=>{
 const {g,p}=cena();const m=g.addMob('saibaman',p.x,p.y,'inicial');m.raro=true;m.name='Boss fatal';p.hp=2;p.dashUntil=0;p.barrierUntil=0;
 assert.equal(g.hit(m,p,100000),true);assert.equal(p.autoHunt,false);g.hit(m,p,100000);
 const a=resumo(p);assert.equal(a.totalMortes,1);assert.equal(a.mortes[0].nome,'Boss fatal');assert.equal(a.mortes[0].chefe,true);assert.equal(a.danoRecebido,2);assert.equal(a.ativo,false);
 p.hp=p.stats.hp;p.autoHunt=true;p.seguroAte=0;g.hit(m,p,100000);assert.equal(resumo(p).totalMortes,2);
});
test('abates fora de caça não entram na sessão e nova sessão limpa encontros',()=>{
 const {g,p}=cena();p.autoHunt=false;const m=g.addMob('saibaman',p.x,p.y,'inicial');m.hp=1;g.hit(p,m,100000);assert.equal(resumo(p).totalAbates,0);
 p.autoHunt=true;const outro=g.addMob('saibaman',p.x,p.y,'inicial');outro.hp=1;g.hit(p,outro,100000);assert.equal(resumo(p).totalAbates,1);
 g.action(p.id,{type:'huntAnalyzerReset'});assert.equal(resumo(p).totalAbates,0);assert.equal(resumo(p).totalMortes,0);
});
test('morte com Auto Hunt OFF cria sessão e registra monstro sem contar tempo ou abates',()=>{
 const {g,p}=cena();p.autoHunt=false;p.hp=1;p.dashUntil=0;p.barrierUntil=0;
 const m=g.addMob('saibaman',p.x,p.y,'inicial');m.name='Saibaman fatal';g.hit(m,p,99999);g.hit(m,p,99999);
 const a=resumo(p);assert.equal(a.totalMortes,1);assert.equal(a.mortes[0].tipo,'saibaman');assert.equal(a.mortes[0].nome,'Saibaman fatal');assert.equal(a.mortes[0].foraAutoHunt,1);assert.equal(a.segundos,0);assert.equal(a.totalAbates,0);assert.equal(a.ativo,false);
});
test('mortes ON e OFF do mesmo inimigo somam corretamente, sem afetar sessão alheia',()=>{
 const {g,p}=cena();const m=g.addMob('saibaman',p.x,p.y,'inicial');m.raro=true;
 p.hp=1;g.hit(m,p,99999);p.hp=1;p.seguroAte=0;g.hit(m,p,99999);
 const a=resumo(p);assert.equal(a.totalMortes,2);assert.equal(a.mortes.length,1);assert.equal(a.mortes[0].foraAutoHunt,1);assert.equal(a.mortes[0].chefe,true);
 const outro=g.addPlayer('outro');assert.equal(resumo(outro).totalMortes,0);
});
