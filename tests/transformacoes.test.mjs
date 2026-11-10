import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {CONFIG,lugar,PORTAIS} from '../public/shared/config.mjs';
import {createGameServer} from '../server.mjs';
import {criarSessaoTeste,reentrarSessaoTeste,postTeste} from './auth-helper.mjs';
import {detalhesHabilidade} from '../public/render/detalhes-habilidades.mjs';

function cena() {
  const g=new Game({now:1000,populate:false}),p=g.addPlayer('p','Goku',{level:50});
  g.levar(p,lugar('inicial'));p.x+=300;p.seguroAte=0;p.autoHeal=p.autoFood=false;
  return {g,p};
}
function passar(g,segundos) { for(let i=0;i<Math.round(segundos/.05);i++)g.tick(.05); }

for(const tecnica of ['kaioken','transform']) {
  const forma=tecnica==='kaioken'?'kaioken':'ssj';
  test(tecnica+': grátis, sem recarga nem duração fixa; mesma tecla desativa',()=>{
    const {g,p}=cena(),ki=p.ki;
    assert.equal(CONFIG.skillCosts[tecnica],0);assert.equal(CONFIG.skillCooldowns[tecnica],0);
    assert.ok(g.cast(p,tecnica).ok);assert.equal(p.ki,ki);assert.equal(p.forma,forma);
    passar(g,13);assert.equal(p.forma,forma);assert.ok(Math.abs(p.ki-(ki-13*3.5))<1e-7);
    assert.ok(g.cast(p,tecnica).ok);assert.equal(p.forma,'base');
    assert.ok(g.cast(p,tecnica).ok);assert.equal(p.forma,forma);
  });
  test(tecnica+': drena sem regenerar; esgotamento avisa uma vez e permite regeneração na base',()=>{
    const {g,p}=cena();g.cast(p,tecnica);p.ki=7;
    passar(g,1);assert.ok(Math.abs(p.ki-3.5)<1e-9);assert.equal(p.forma,forma);
    p.ki=.1;g.tick(.05);assert.equal(p.ki,0);assert.equal(p.forma,'base');
    assert.equal(g.events.filter(e=>e.text==='Ki esgotado. Forma base.').length,1);
    g.tick(.05);assert.ok(p.ki>0);assert.equal(g.events.filter(e=>e.text==='Ki esgotado. Forma base.').length,1);
  });
  test(tecnica+': morte, viagem e desconexão encerram forma; save/reconexão começa na base',()=>{
    for(const encerrar of [
      (g,p)=>{p.hp=0;p.respawnAt=Infinity;g.tick(.05);},
      (g,p)=>g.levar(p,lugar('media')),
      (g,p)=>{p.connected=false;g.tick(.05);},
      (g,p)=>{const tp=PORTAIS.find(o=>o.area===p.area);p.x=tp.x;p.y=tp.y;assert.ok(g.usePortal(p,tp.destinos[0]).ok);}
    ]) {const {g,p}=cena();g.cast(p,tecnica);encerrar(g,p);assert.equal(p.forma,'base');assert.equal(p.transformed,false);}
    const {g,p}=cena();g.cast(p,tecnica);const salvo=g.exportPlayer(p);
    for(const chave of ['forma','transformed','kaiokenUntil','kaiokenReady','transformReady'])assert.equal(chave in salvo,false);
    assert.equal(g.addPlayer('novo','Goku',{...salvo,forma,transformed:true,kaiokenUntil:Infinity}).forma,'base');
  });
  test(tecnica+': God Mode preserva Ki cheio e forma até desligar manualmente',()=>{
    const {g,p}=cena();p.godmode=true;g.cast(p,tecnica);passar(g,20);
    assert.equal(p.ki,p.stats.ki);assert.equal(p.forma,forma);g.cast(p,tecnica);assert.equal(p.forma,'base');
  });
  test(tecnica+': HUD informa manutenção, estado ativo e ausência de custo/recarga',()=>{
    const {g,p}=cena();g.cast(p,tecnica);const d=Object.fromEntries(detalhesHabilidade(tecnica,g.snapshot(p.id).self).linhas);
    assert.equal(d.Custo,'Sem custo');assert.equal(d.Cooldown,'Sem recarga');assert.equal(d.Estado,'ATIVO');
    assert.match(d.Manutenção,/3,5 Ki\/s/);assert.match(d.Término,/Ki zerar/);
  });
}
test('formas se substituem nos dois sentidos e alias transformed não pode acumular bônus',()=>{
  const {g,p}=cena();g.cast(p,'kaioken');assert.equal(p.transformed,false);
  g.action(p.id,{type:'transform'});assert.equal(p.forma,'ssj');assert.equal(p.transformed,true);
  g.cast(p,'kaioken');assert.equal(p.forma,'kaioken');assert.equal(p.transformed,false);
  assert.equal(g.snapshot(p.id).self.transformRemaining,0);assert.equal(g.snapshot(p.id).self.kaiokenRemaining,0);
});
test('automação não alterna nem desliga formas; entrada automática exige base e mais de 50% Ki',()=>{
  for(const forma of ['kaioken','ssj'])for(const tecnica of ['kaioken','transform']) {
    const {g,p}=cena();p.forma=forma;
    assert.equal(g.cast(p,tecnica,true).ok,false);assert.equal(p.forma,forma);
    p.autoSkills=p.autoHunt=true;g.addMob('melee',p.x+40,p.y);g.tick(.05);assert.equal(p.forma,forma);
  }
  for(const tecnica of ['kaioken','transform']) {
    const {g,p}=cena();p.ki=p.stats.ki*.5;assert.equal(g.cast(p,tecnica,true).ok,false);
    p.ki++;assert.equal(g.cast(p,tecnica,true).ok,true);
  }
});
test('snapshot entrega a forma para observador do mesmo lugar e exclui outras hunts',()=>{
  const {g,p}=cena(),b=g.addPlayer('b'),c=g.addPlayer('c');g.levar(b,lugar('inicial'));g.levar(c,lugar('media'));
  g.cast(p,'kaioken');assert.equal(g.snapshot(b.id).players.find(j=>j.id===p.id).forma,'kaioken');
  assert.equal(g.snapshot(c.id).players.some(j=>j.id===p.id),false);
});
test('soco, rajada e Genki aplicam bônus somente à forma ativa e preservam SSJ',()=>{
  for(const [forma,soco,rajada,genki] of [['base',1,1.4,10],['kaioken',1.4,1.4*1.4,14],['ssj',1.5,2.1,14]]) {
    const {g,p}=cena();p.forma=forma;
    const m=g.addMob('melee',p.x+30,p.y);m.hp=m.maxHp=100000;m.speed=0;p.targetId=m.id;
    const defesa=100/(100+(m.defesa??1)*3);
    g.cast(p,'basic');assert.equal(m.maxHp-m.hp,Math.round(p.stats.attack*soco*defesa));
    g.cast(p,'ki');assert.equal(g.projectiles.at(-1).damage,p.stats.attack*rajada);
    g.cast(p,'genki');assert.equal(g.genkiCharges.at(-1).damage,p.stats.attack*genki);
    p.forma='base';p.basicReady=0;const antes=m.hp;g.cast(p,'basic');assert.equal(antes-m.hp,Math.round(p.stats.attack*defesa));
  }
});
test('gastar o último Ki numa técnica encerra forma imediatamente com aviso',()=>{
  const {g,p}=cena();g.cast(p,'kaioken');p.ki=7;g.cast(p,'ki');
  assert.equal(p.ki,0);assert.equal(p.forma,'base');assert.ok(g.events.some(e=>e.text==='Ki esgotado. Forma base.'));
});
test('desconexão HTTP encerra forma no servidor antes de reconectar',async()=>{
  const app=await createGameServer({port:0,dataDir:null,noticiasMain:{consultar:async()=>[]}});
  const base='http://127.0.0.1:'+app.port;
  try {
    const sessao=await criarSessaoTeste(base,'Kaioken HTTP'),p=app.game.players.get(sessao.playerId);p.level=50;
    app.game.cast(p,'kaioken');assert.equal(p.forma,'kaioken');
    await postTeste(base,'auth/voltar',{},sessao.token);assert.equal(p.forma,'base');assert.equal(p.connected,false);
    const novo=await reentrarSessaoTeste(base,sessao.token);assert.equal(app.game.players.get(novo.playerId).forma,'base');
  } finally {await app.close();}
});
