import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/nucleo/game.mjs';
import {existsSync} from 'node:fs';
import {barraPadrao,barraValida,acaoDaTecnica,tecnicaDisponivel,TECNICAS,MAGIAS_PERSONAGEM} from '../public/shared/tecnicas/barra-tecnicas.mjs';
import {xpForLevel,statsFor,aplicarGodmode} from '../public/shared/nucleo/characters.mjs';

test('barra antiga migra para oito teclas e preserva consumíveis configurados',()=>{
 const b=barraValida(null,{7:'seed30',8:'food'},15);
 assert.equal(b.length,8);assert.deepEqual(b.slice(0,6),['skill:heal','skill:kame','skill:ryuken','skill:barrier','form:auto','skill:genki']);
 assert.deepEqual(b.slice(6),['item:seed30','item:food']);
 assert.equal(acaoDaTecnica('form:kaioken').forma,'kaioken');
 assert.deepEqual(acaoDaTecnica('item:seed30'),{type:'seed',potency:30});
});

test('catálogo lista habilidades e todas as formas com desbloqueios corretos',()=>{
 for(const id of ['skill:heal','skill:ki','skill:dash','skill:kame','skill:barrier','skill:genki','skill:ryuken','skill:superKamehameha','form:kaioken','form:ssj','form:ssj2','form:ssj3','form:ssj4','form:gogeta','form:vegito'])assert.ok(TECNICAS.some(t=>t.id===id));
 assert.equal(TECNICAS.find(t=>t.id==='form:ssj').nivel,100);
 assert.equal(TECNICAS.find(t=>t.id==='form:kaioken').nivel,50);
 assert.equal(TECNICAS.find(t=>t.id==='skill:ryuken').nivel,300);
 assert.equal(TECNICAS.find(t=>t.id==='skill:superKamehameha').nivel,500);
 assert.deepEqual(acaoDaTecnica('skill:superKamehameha'),{type:'skill',skill:'superKamehameha'});
});

test('aba Técnicas contém só magias e formas, cada uma com seu ícone disponível',()=>{
 assert.deepEqual(MAGIAS_PERSONAGEM.filter(t=>t.id.startsWith('skill:')).map(t=>t.id),['skill:heal','skill:kame','skill:barrier','skill:genki','skill:ryuken','skill:superKamehameha']);
 assert.deepEqual(MAGIAS_PERSONAGEM.filter(t=>t.id.startsWith('form:')).map(t=>t.id),['form:kaioken','form:ssj','form:ssj2','form:ssj3','form:ssj4','form:gogeta','form:vegito']);
 assert.ok(MAGIAS_PERSONAGEM.every(t=>Boolean(t.imagem||t.icone)));
 for(const t of MAGIAS_PERSONAGEM)if(t.imagem)assert.ok(existsSync(new URL('../public'+t.imagem,import.meta.url)),t.imagem);
});

test('servidor salva slots válidos e rejeita IDs desconhecidos ou repetidos',()=>{
 const g=new Game(),p=g.addPlayer('barra','Goku');
 const slots=['skill:kame','skill:heal','form:kaioken','item:ki','skill:barrier','skill:genki',null,null];
 assert.equal(g.action(p.id,{type:'configurarBarra',slots}).ok,true);
 assert.deepEqual(g.exportPlayer(p).barraTecnicas,slots);
 assert.deepEqual(g.addPlayer('copia','Goku',g.exportPlayer(p)).barraTecnicas,slots);
 assert.equal(g.action(p.id,{type:'configurarBarra',slots:[...slots.slice(0,7),'skill:kame']}).ok,false);
 assert.equal(g.action(p.id,{type:'configurarBarra',slots:[...slots.slice(0,7),'skill:inexistente']}).ok,false);
 assert.deepEqual(p.barraTecnicas,slots);
});

test('no nível 500 o SSJ4 troca o Kamehameha padrão; a forma base o restaura',()=>{
 const g=new Game(),p=g.addPlayer('super-padrao','Goku');
 p.level=499;p.stats=statsFor(499);p.xp=xpForLevel(499)-1;
 assert.equal(p.barraTecnicas[1],'skill:kame');
 g.awardXp(p,1);
 assert.equal(p.level,500);
 assert.equal(p.barraTecnicas[1],'skill:kame');
 assert.equal(tecnicaDisponivel('skill:superKamehameha',p),false);
 assert.equal(g.cast(p,'superKamehameha').ok,false);
 assert.equal(g.action(p.id,{type:'transform',forma:'ssj4'}).ok,true);
 assert.equal(p.barraTecnicas[1],'skill:superKamehameha');
 assert.equal(g.snapshot(p.id).self.barraTecnicas[1],'skill:superKamehameha');
 assert.equal(tecnicaDisponivel('skill:superKamehameha',p),true);
 assert.deepEqual(p.barraTecnicas.filter((_,i)=>i!==1),barraPadrao().filter((_,i)=>i!==1));
 assert.equal(g.addPlayer('super-reconexao','Goku',g.exportPlayer(p)).barraTecnicas[1],'skill:kame');
 assert.equal(g.action(p.id,{type:'transform',forma:'ssj4'}).ok,true);
 assert.equal(p.barraTecnicas[1],'skill:kame');
 assert.equal(g.action(p.id,{type:'transform',forma:'ssj4'}).ok,true);
 assert.equal(p.barraTecnicas[1],'skill:superKamehameha');
 const manual=[...p.barraTecnicas];manual[1]='skill:kame';
 assert.equal(g.action(p.id,{type:'configurarBarra',slots:manual}).ok,true);
 assert.equal(g.action(p.id,{type:'transform',forma:'ssj4'}).ok,true);
 assert.equal(g.action(p.id,{type:'transform',forma:'ssj4'}).ok,true);
 assert.equal(p.barraTecnicas[1],'skill:kame');
 assert.equal(g.addPlayer('super-manual','Goku',g.exportPlayer(p)).barraTecnicas[1],'skill:kame');
});

test('outros slots personalizados não impedem a troca; alteração manual do slot do Kamehameha é preservada',()=>{
 const g=new Game(),p=g.addPlayer('super-custom','Goku');
 assert.equal(g.action(p.id,{type:'configurarBarra',slots:[...p.barraTecnicas]}).ok,true);
 p.level=499;p.stats=statsFor(499);p.xp=xpForLevel(499)-1;g.awardXp(p,1);
 assert.equal(p.barraTecnicas[1],'skill:kame');
 assert.equal(g.action(p.id,{type:'transform',forma:'ssj4'}).ok,true);
 assert.equal(p.barraTecnicas[1],'skill:superKamehameha');
 const legado=g.addPlayer('super-legado','Goku',{level:500,barraTecnicas:barraPadrao()});
 assert.equal(legado.barraTecnicas[1],'skill:kame');
 assert.equal(g.action(legado.id,{type:'transform',forma:'ssj4'}).ok,true);
 assert.equal(legado.barraTecnicas[1],'skill:superKamehameha');
 const alterada=[...barraPadrao()];[alterada[0],alterada[1]]=[alterada[1],alterada[0]];
 const legadoCustom=g.addPlayer('super-legado-custom','Goku',{level:500,barraTecnicas:alterada});
 assert.equal(g.action(legadoCustom.id,{type:'transform',forma:'ssj4'}).ok,true);
 assert.deepEqual(legadoCustom.barraTecnicas,alterada);
});

test('God Mode no nível 500 só mostra Super Kamehameha enquanto SSJ4 está ativo',()=>{
 const g=new Game(),p=g.addPlayer('super-godmode','Goku');
 aplicarGodmode(p,true,{level:500});
 assert.equal(p.barraTecnicas[1],'skill:kame');
 assert.equal(g.action(p.id,{type:'transform',forma:'ssj4'}).ok,true);
 assert.equal(p.barraTecnicas[1],'skill:superKamehameha');
 assert.equal(g.action(p.id,{type:'transform',forma:'ssj4'}).ok,true);
 assert.equal(p.barraTecnicas[1],'skill:kame');
 aplicarGodmode(p,false);
 assert.equal(p.barraTecnicas[1],'skill:kame');
});

test('nível 100 pode selecionar Kaioken; nível baixo não pode ativar Super Saiyajin',()=>{
 const g=new Game(),p=g.addPlayer('formas-barra','Goku');p.level=100;
 assert.equal(g.action(p.id,{type:'transform',forma:'kaioken'}).ok,true);assert.equal(p.forma,'kaioken');
 assert.equal(g.action(p.id,{type:'transform',forma:'ssj'}).ok,true);assert.equal(p.forma,'ssj');
 assert.equal(g.action(p.id,{type:'transform',forma:'kaioken'}).ok,true);assert.equal(p.forma,'kaioken');
 assert.equal(g.action(p.id,{type:'transform',forma:'kaioken'}).ok,true);assert.equal(p.forma,'base');
 p.level=50;assert.equal(g.action(p.id,{type:'transform',forma:'ssj'}).ok,false);assert.equal(p.forma,'base');
});

test('restaurar a barra monta o padrão da vocação, persiste e reativa a troca automática do Kamehameha', () => {
 const game = new Game({ populate: false });
 const goku = game.addPlayer('goku-reset', 'Goku', { level: 500, seedSelected: 30, hotkeysConsumiveis: { 7: 'food' } });
 const vegeta = game.addPlayer('vegeta-reset', 'Vegeta', { vocacao: 'vegeta', level: 500 });
 const casos = [
  [goku, ['skill:heal','skill:superKamehameha','skill:ryuken','skill:barrier','form:auto','skill:genki','item:seed30','item:ki']],
  [vegeta, ['skill:heal','skill:galick',null,null,'form:auto','skill:finalFlash','item:food','item:ki']]
 ];
 assert.ok(game.action(goku.id, { type: 'transform', forma: 'ssj4' }).ok);
 for (const [player, esperado] of casos) {
  assert.ok(game.action(player.id, { type: 'configurarBarra', slots: ['skill:heal','item:food',null,null,null,null,null,null] }).ok);
  assert.equal(player.barraPersonalizada, true);
  assert.ok(game.action(player.id, { type: 'restaurarBarraPadrao' }).ok);
  assert.deepEqual(game.snapshot(player.id).self.barraTecnicas, esperado);
  const salvo = game.exportPlayer(player);
  assert.equal(salvo.barraPersonalizada, false);
  assert.equal(salvo.barraKameManual, false);
  const reconectado = game.addPlayer(player.id + '-reconectado', player.name, salvo);
  assert.deepEqual(reconectado.barraTecnicas, esperado.map(id => id === 'skill:superKamehameha' ? 'skill:kame' : id));
 }
 assert.equal(goku.hotkeysConsumiveis[7], 'food');
 assert.ok(game.action(goku.id, { type: 'transform', forma: 'ssj4' }).ok);
 assert.equal(goku.barraTecnicas[1], 'skill:kame');
});

test('restauração de save migra a ordem antiga padrão de Goku e preserva a antiga personalizada', () => {
 const game = new Game({ populate: false });
 const anterior = ['skill:heal','skill:kame','form:auto','skill:barrier','skill:genki','item:seed15','item:ki','skill:ryuken'];
 const padrao = game.addPlayer('antigo-goku', 'Goku', { barraTecnicas: anterior });
 const personalizado = game.addPlayer('goku-personalizado', 'Goku', { barraTecnicas: anterior, barraPersonalizada: true });
 assert.deepEqual(padrao.barraTecnicas, barraPadrao());
 assert.deepEqual(personalizado.barraTecnicas, anterior);
});
