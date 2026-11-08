import test from 'node:test';import assert from 'node:assert/strict';
import {ATALHOS,atalhoDeInterface} from '../public/shared/atalhos.mjs';
const evento=(key,extras={})=>({key,...extras});
test('todas as teclas de menus, combate e movimento têm uma única função',()=>{
 const usadas=new Map();for(const a of ATALHOS)for(const k of a.teclas){assert.equal(usadas.has(k),false,'Conflito: '+k);usadas.set(k,a.id);}assert.equal(usadas.get('r'),'consumivel7');assert.equal(usadas.get('q'),'consumivel8');assert.equal(usadas.get('t'),'transformar');
});
test('novos atalhos mapeiam funções solicitadas sem manter B como mochila',()=>{
 for(const [key,id]of Object.entries({Tab:'personagem',i:'mochila',j:'missoes',b:'bestiario',m:'mapa',o:'store',p:'battlepass',l:'loja',v:'ranking',g:'guilda',c:'correio',Escape:'ajustes',h:'caca',y:'painelCaca',x:'montaria',Enter:'chat'}))assert.equal(atalhoDeInterface(evento(key)).id,id);
 assert.equal(atalhoDeInterface(evento('I')).id,'mochila');assert.equal(atalhoDeInterface(evento('r')),null);assert.equal(atalhoDeInterface(evento('F1')),null);
});
test('Ctrl, Alt, Cmd, Shift+Tab, repetição e composição não disparam atalhos da interface',()=>{
 for(const mod of ['ctrlKey','altKey','metaKey','shiftKey','repeat','isComposing'])for(const key of ['Tab','i','h','x','r'])assert.equal(atalhoDeInterface(evento(key,{[mod]:true})),null);
});
test('campos de texto, selects e conteúdo editável recebem suas teclas normalmente',()=>{
 for(const target of [{tagName:'INPUT'},{tagName:'TEXTAREA'},{tagName:'SELECT'},{tagName:'DIV',isContentEditable:true},{tagName:'SPAN',closest:()=>({})}])for(const key of ['i','h','x','Tab'])assert.equal(atalhoDeInterface(evento(key,{target})),null);
});
