import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {CONFIG,lugar,PORTAIS} from '../public/shared/config.mjs';
import {createGameServer} from '../server.mjs';
import {criarSessaoTeste,reentrarSessaoTeste,postTeste} from './auth-helper.mjs';
import {detalhesHabilidade} from '../public/render/detalhes-habilidades.mjs';
import {FORMAS,formaDisponivel,DANO_DA_FORMA} from '../public/shared/formas.mjs';

function cena(level=50) {
  const g=new Game({now:1000,populate:false}),p=g.addPlayer('p','Goku',{level});
  g.levar(p,lugar('inicial'));p.x+=300;p.seguroAte=0;p.autoHeal=p.autoFood=false;
  return {g,p};
}
function passar(g,segundos) { for(let i=0;i<Math.round(segundos/.05);i++)g.tick(.05); }

// Escada (Pedro, 11/11/2026): um botão só; ativa a forma mais forte liberada. 'kaioken' e 'transform' são o mesmo comando.
for(const {forma,nivel} of FORMAS)for(const tecnica of ['kaioken','transform']) {
  const cena_=()=>cena(nivel);
  test(forma+' ('+tecnica+'): grátis, sem recarga nem duração fixa; mesma tecla desativa',()=>{
    const {g,p}=cena_(),ki=p.ki;
    assert.equal(CONFIG.skillCosts[tecnica],0);assert.equal(CONFIG.skillCooldowns[tecnica],0);
    assert.ok(g.cast(p,tecnica).ok);assert.equal(p.ki,ki);assert.equal(p.forma,forma);
    passar(g,13);assert.equal(p.forma,forma);assert.ok(Math.abs(p.ki-(ki-13*3.5))<1e-7);
    assert.ok(g.cast(p,tecnica).ok);assert.equal(p.forma,'base');
    assert.ok(g.cast(p,tecnica).ok);assert.equal(p.forma,forma);
  });
  test(forma+' ('+tecnica+'): drena sem regenerar; esgotamento avisa uma vez e permite regeneração na base',()=>{
    const {g,p}=cena_();g.cast(p,tecnica);p.ki=7;
    passar(g,1);assert.ok(Math.abs(p.ki-3.5)<1e-9);assert.equal(p.forma,forma);
    p.ki=.1;g.tick(.05);assert.equal(p.ki,0);assert.equal(p.forma,'base');
    assert.equal(g.events.filter(e=>e.text==='Ki esgotado. Forma base.').length,1);
    g.tick(.05);assert.ok(p.ki>0);assert.equal(g.events.filter(e=>e.text==='Ki esgotado. Forma base.').length,1);
  });
  test(forma+' ('+tecnica+'): morte, viagem e desconexão encerram forma; save/reconexão começa na base',()=>{
    for(const encerrar of [
      (g,p)=>{p.hp=0;p.respawnAt=Infinity;g.tick(.05);},
      (g,p)=>g.levar(p,lugar('media')),
      (g,p)=>{p.connected=false;g.tick(.05);},
      (g,p)=>{const tp=PORTAIS.find(o=>o.area===p.area);p.x=tp.x;p.y=tp.y;assert.ok(g.usePortal(p,tp.destinos[0]).ok);}
    ]) {const {g,p}=cena_();g.cast(p,tecnica);encerrar(g,p);assert.equal(p.forma,'base');assert.equal(p.transformed,false);}
    const {g,p}=cena_();g.cast(p,tecnica);const salvo=g.exportPlayer(p);
    for(const chave of ['forma','transformed','kaiokenUntil','kaiokenReady','transformReady'])assert.equal(chave in salvo,false);
    assert.equal(g.addPlayer('novo','Goku',{...salvo,forma,transformed:true,kaiokenUntil:Infinity}).forma,'base');
  });
  test(forma+' ('+tecnica+'): God Mode preserva Ki cheio e forma até desligar manualmente',()=>{
    const {g,p}=cena_();p.godmode=true;g.cast(p,tecnica);passar(g,20);
    assert.equal(p.ki,p.stats.ki);assert.equal(p.forma,forma);g.cast(p,tecnica);assert.equal(p.forma,'base');
  });
  test(forma+' ('+tecnica+'): HUD informa manutenção, estado ativo e ausência de custo/recarga',()=>{
    const {g,p}=cena_();g.cast(p,tecnica);const d=Object.fromEntries(detalhesHabilidade(tecnica,g.snapshot(p.id).self).linhas);
    assert.equal(d.Custo,'Sem custo');assert.equal(d.Cooldown,'Sem recarga');assert.equal(d.Estado,'ATIVO');
    assert.match(d.Manutenção,/3,5 Ki\/s/);assert.match(d.Término,/Ki zerar/);
  });
}
test('escada: só a forma mais forte liberada; Kaioken some quando o SSJ libera e o SSJ2 substitui o SSJ',()=>{
  const k=FORMAS.find(f=>f.forma==='kaioken').nivel,s=FORMAS.find(f=>f.forma==='ssj').nivel,s2=FORMAS.find(f=>f.forma==='ssj2').nivel;
  assert.ok(k<s&&s<s2);
  assert.equal(formaDisponivel(k-1),null);assert.equal(formaDisponivel(k).forma,'kaioken');assert.equal(formaDisponivel(s-1).forma,'kaioken');
  assert.equal(formaDisponivel(s).forma,'ssj');assert.equal(formaDisponivel(s2-1).forma,'ssj');assert.equal(formaDisponivel(s2).forma,'ssj2');
  {const {g,p}=cena(k-1);assert.equal(g.cast(p,'transform').ok,false);assert.equal(p.forma,'base');}
  for(const [nivel,esperada] of [[k,'kaioken'],[s,'ssj'],[s2,'ssj2']])for(const tecnica of ['kaioken','transform']){
    const {g,p}=cena(nivel);assert.ok(g.cast(p,tecnica).ok);assert.equal(p.forma,esperada,tecnica+' no nível '+nivel);
    assert.equal(p.transformed,esperada!=='kaioken');
    g.action(p.id,{type:'transform'});assert.equal(p.forma,'base','apertar de novo volta à base');
  }
  const {g,p}=cena(s);g.cast(p,'transform');assert.equal(g.snapshot(p.id).self.transformRemaining,0);assert.equal(g.snapshot(p.id).self.kaiokenRemaining,0);
});
test('SSJ2 = SSJ × 1,5 em soco, rajada, Kamehameha e Genki; mesmo dreno de Ki',()=>{
  for(const golpe of ['soco','rajada','kame','genki'])assert.ok(Math.abs(DANO_DA_FORMA.ssj2[golpe]-DANO_DA_FORMA.ssj[golpe]*1.5)<1e-9,golpe);
  assert.equal(CONFIG.transformacao.drenoKi,3.5);
});
test('automação não alterna nem desliga formas; entrada automática exige base e mais de 50% Ki',()=>{
  for(const forma of ['kaioken','ssj','ssj2'])for(const tecnica of ['kaioken','transform']) {
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
  const {g,p}=cena(FORMAS[0].nivel),b=g.addPlayer('b'),c=g.addPlayer('c');g.levar(b,lugar('inicial'));g.levar(c,lugar('media'));
  g.cast(p,'kaioken');assert.equal(g.snapshot(b.id).players.find(j=>j.id===p.id).forma,'kaioken');
  assert.equal(g.snapshot(c.id).players.some(j=>j.id===p.id),false);
});
test('soco, rajada e Genki aplicam bônus somente à forma ativa e preservam SSJ',()=>{
  for(const [forma,soco,rajada,genki] of [['base',1,1.4,10],['kaioken',1.4,1.4*1.4,14],['ssj',1.5,2.1,14],['ssj2',2.25,3.15,21]]) {
    const {g,p}=cena();p.forma=forma;
    const m=g.addMob('melee',p.x+30,p.y);m.hp=m.maxHp=100000;m.speed=0;p.targetId=m.id;
    const defesa=100/(100+(m.defesa??1)*3);
    g.cast(p,'basic');assert.equal(m.maxHp-m.hp,Math.round(p.stats.attack*soco*defesa));
    g.cast(p,'ki');assert.ok(Math.abs(g.projectiles.at(-1).damage-p.stats.attack*rajada)<1e-9);
    g.cast(p,'genki');assert.ok(Math.abs(g.genkiCharges.at(-1).damage-p.stats.attack*genki)<1e-9);
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
    app.game.cast(p,'kaioken');assert.equal(p.forma,formaDisponivel(50).forma);
    await postTeste(base,'auth/voltar',{},sessao.token);assert.equal(p.forma,'base');assert.equal(p.connected,false);
    const novo=await reentrarSessaoTeste(base,sessao.token);assert.equal(app.game.players.get(novo.playerId).forma,'base');
  } finally {await app.close();}
});
