import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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
  test(forma+' ('+tecnica+'): sem custo/recarga; tecla única ativa e desativa',()=>{
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
    for(const chave of ['forma','formaAte','transformed','kaiokenUntil','kaiokenReady','transformReady'])assert.equal(chave in salvo,false);
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
test('escada libera a forma mais forte nos níveis 50, 100, 200, 300, 500, 700 e 900',()=>{
  assert.deepEqual(FORMAS.map(f=>[f.forma,f.nivel]),[
    ['kaioken',50],['ssj',100],['ssj2',200],['ssj3',300],['ssj4',500],['gogeta',700],['vegito',900]
  ]);
  for(let i=0;i<FORMAS.length;i++){
    const forma=FORMAS[i],anterior=FORMAS[i-1];
    assert.equal(formaDisponivel(forma.nivel-1)?.forma||null,anterior?.forma||null);
    assert.equal(formaDisponivel(forma.nivel).forma,forma.forma);
  }
  {const {g,p}=cena(49);assert.equal(g.cast(p,'transform').ok,false);assert.equal(p.forma,'base');}
  for(const {nivel,forma:esperada} of FORMAS)for(const tecnica of ['kaioken','transform']){
    const {g,p}=cena(nivel);assert.ok(g.cast(p,tecnica).ok);assert.equal(p.forma,esperada,tecnica+' no nível '+nivel);
    assert.equal(p.transformed,esperada!=='kaioken');
    g.action(p.id,{type:'transform'});assert.equal(p.forma,'base','apertar de novo volta à base');
  }
  const {g,p}=cena(100);g.cast(p,'transform');assert.equal(g.snapshot(p.id).self.transformRemaining,0);assert.equal(g.snapshot(p.id).self.kaiokenRemaining,0);
});
test('a HUD preserva os cinco slots originais e mantém a transformação na terceira posição',async()=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  assert.equal((html.match(/id="transformButton"/g)||[]).length,1);
  // Os quatro data-skill originais + o Ryuken (Pedro, 16/11/2026: botão próprio, tecla 8, depois dos consumíveis).
  assert.equal((html.match(/<button[^>]*data-skill=/g)||[]).length,5);
  assert.ok(html.indexOf('data-skill="ryuken"')>html.indexOf('id="kiPotionButton"'));
  assert.doesNotMatch(html,/hud-buffslot/);
  assert.ok(html.indexOf('id="transformButton"')>html.indexOf('data-skill="kame"'));
  assert.ok(html.indexOf('id="transformButton"')<html.indexOf('data-skill="barrier"'));
});
test('Gogeta dura uma hora, mostra contagem restante e retorna à base ao expirar',()=>{
  const {g,p}=cena(700);p.godmode=true;assert.ok(g.cast(p,'transform').ok);assert.equal(p.forma,'gogeta');
  assert.equal(p.formaAte-g.time,CONFIG.transformacao.gogetaDuracao);
  assert.equal(g.snapshot(p.id).self.transformRemaining,CONFIG.transformacao.gogetaDuracao);
  g.time=p.formaAte-.05;g.tick(.05);assert.equal(p.forma,'base');assert.equal(p.formaAte,0);
  assert.ok(g.events.some(e=>e.text==='A fusão de Gogeta terminou. Forma base.'));
});
test('SSJ2 = SSJ × 1,5 em soco, rajada, Kamehameha e Genki; mesmo dreno de Ki',()=>{
  for(const golpe of ['soco','rajada','kame','genki'])assert.ok(Math.abs(DANO_DA_FORMA.ssj2[golpe]-DANO_DA_FORMA.ssj[golpe]*1.5)<1e-9,golpe);
  assert.equal(CONFIG.transformacao.drenoKi,3.5);
});
test('automação não alterna nem desliga formas; entrada automática exige base e mais de 50% Ki',()=>{
  for(const {forma} of FORMAS)for(const tecnica of ['kaioken','transform']) {
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
test('soco, rajada e Genki aplicam bônus somente à forma ativa',()=>{
  for(const [forma,soco,rajada,genki] of [['base',1,1.4,10],['kaioken',1.4,1.4*1.4,14],['ssj',1.5,2.1,14],['ssj2',2.25,3.15,21]]) {
    const {g,p}=cena(CONFIG.skills.genki);p.forma=forma;
    const m=g.addMob('melee',p.x+30,p.y);m.hp=m.maxHp=100000;m.speed=0;p.targetId=m.id;
    const defesa=100/(100+(m.defesa??1)*3);
    g.cast(p,'basic');assert.equal(m.maxHp-m.hp,Math.round(p.stats.attack*soco*defesa));
    g.cast(p,'ki');assert.ok(Math.abs(g.projectiles.at(-1).damage-p.stats.attack*rajada)<1e-9);
    g.cast(p,'genki');assert.ok(Math.abs(g.genkiCharges.at(-1).damage-p.stats.attack*genki)<1e-9);
    p.forma='base';p.basicReady=0;const antes=m.hp;g.cast(p,'basic');assert.equal(antes-m.hp,Math.round(p.stats.attack*defesa));
  }
});
test('cada evolução aumenta dano por 1,5 sem acumular formas',()=>{
  for(const [anterior,forma] of [['ssj','ssj2'],['ssj2','ssj3'],['ssj3','ssj4'],['ssj4','gogeta'],['gogeta','vegito']])
    for(const golpe of ['soco','rajada','kame','genki'])
      assert.ok(Math.abs(DANO_DA_FORMA[forma][golpe]-DANO_DA_FORMA[anterior][golpe]*1.5)<=.001,forma+' '+golpe);
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
