import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/game.mjs';
import { novidadesDaAba } from '../public/shared/novidades.mjs';
const aviso = (id='mensagem-1',aba='correio') => ({id,aba,titulo:'Mensagem recebida',texto:'Conteúdo real publicado pelo servidor.'});

test('abas começam sem alertas e avisos comuns de combate não geram novidades', () => {
  const g=new Game({populate:false}),p=g.addPlayer('p');
  g.notify(p,'Ki insuficiente');
  assert.deepEqual(g.snapshot(p.id).self.novidades,[]);
  assert.deepEqual(novidadesDaAba(p.novidades,'correio'),[]);
});

test('novidades ficam restritas ao jogador e aba corretos, sem duplicar o mesmo id', () => {
  const g=new Game({populate:false}),p=g.addPlayer('p'),outro=g.addPlayer('q');
  assert.equal(g.notificarNovidade(p,aviso()),true);
  assert.equal(g.notificarNovidade(p,aviso()),false);
  assert.equal(g.notificarNovidade(p,aviso('missao-1','missoes')),true);
  assert.equal(novidadesDaAba(g.snapshot(p.id).self.novidades,'correio').length,1);
  assert.equal(novidadesDaAba(p.novidades,'missoes').length,1);
  assert.equal(novidadesDaAba(p.novidades,'ajustes').length,0);
  assert.deepEqual(g.snapshot(outro.id).self.novidades,[]);
  assert.equal(g.action(outro.id,{type:'notificarNovidade',...aviso()}).ok,false,'cliente não publica novidades');
});

test('marcar como lida não afeta outras abas ou jogadores e persiste após reconexão', () => {
  const g=new Game({populate:false}),p=g.addPlayer('p'),outro=g.addPlayer('q');
  g.notificarNovidade(p,aviso());g.notificarNovidade(p,aviso('missao-1','missoes'));g.notificarNovidade(outro,aviso());
  assert.equal(g.action(p.id,{type:'lerNovidades',ids:['mensagem-1']}).ok,true);
  assert.equal(novidadesDaAba(p.novidades,'correio').length,0);
  assert.equal(novidadesDaAba(p.novidades,'missoes').length,1);
  assert.equal(novidadesDaAba(outro.novidades,'correio').length,1);
  const reconectado=g.addPlayer('r','Teste',g.exportPlayer(p));
  assert.equal(novidadesDaAba(reconectado.novidades,'correio').length,0);
  assert.equal(novidadesDaAba(reconectado.novidades,'missoes').length,1);
  g.notificarNovidade(reconectado,aviso('mensagem-2'));
  assert.equal(novidadesDaAba(reconectado.novidades,'correio').length,1);
});

test('dados inválidos são rejeitados e saves antigos migram sem alertas artificiais', () => {
  const g=new Game({populate:false}),p=g.addPlayer('p');
  for(const n of [{},aviso('','correio'),aviso('x','inexistente'),{...aviso(),texto:''},{...aviso(),titulo:123}]) assert.equal(g.notificarNovidade(p,n),false);
  for(const ids of [null,'mensagem-1',[1],Array(101).fill('a')])assert.equal(g.action(p.id,{type:'lerNovidades',ids}).ok,false);
  const antigo=g.addPlayer('antigo','Teste',{level:2});assert.deepEqual(antigo.novidades,[]);
  const salvo=g.addPlayer('salvo','Teste',{novidades:[aviso(),aviso(),{}, {...aviso('lida'),lida:true}]});
  assert.equal(salvo.novidades.length,2);assert.equal(novidadesDaAba(salvo.novidades,'correio').length,1);
});
