import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/game.mjs';
import {createPlayer,exportPlayer} from '../public/shared/characters.mjs';
const cena=()=>{const g=new Game({now:1000,populate:false});return {g,p:g.addPlayer('p')};};
test('slots 7 e 8 recebem somente consumíveis existentes, sem gastar estoque',()=>{
 const {g,p}=cena();const antes=JSON.stringify(p.inventory);
 assert.equal(g.action('p',{type:'atribuirConsumivelHotkey',slot:7,item:'ki'}).ok,true);
 assert.equal(g.action('p',{type:'atribuirConsumivelHotkey',slot:8,item:'seed30'}).ok,true);
 assert.equal(JSON.stringify(p.inventory),antes);assert.deepEqual(p.hotkeysConsumiveis,{7:'ki',8:'seed30'});
 for(const dados of [{slot:1,item:'food'},{slot:6,item:'ki'},{slot:9,item:'ki'},{slot:'7',item:'ki'},{slot:7,item:'scrap'},{slot:7,item:'crystal'},{slot:7,item:'seed99'},{slot:7,item:'__proto__'}])assert.equal(g.action('p',{type:'atribuirConsumivelHotkey',...dados}).ok,false);
 p.inventory.food=0;assert.equal(g.action('p',{type:'atribuirConsumivelHotkey',slot:7,item:'food'}).ok,false);
});
test('clique e hotkey usam item vinculado uma vez respeitando recarga compartilhada',()=>{
 const {g,p}=cena();p.hp=1;
 for(const slot of [7,8])g.action('p',{type:'atribuirConsumivelHotkey',slot,item:'seed30'});
 assert.equal(g.action('p',{type:'usarConsumivelHotkey',slot:7}).ok,true);const hp=p.hp;
 assert.equal(g.action('p',{type:'usarConsumivelHotkey',slot:8}).ok,false);assert.equal(p.inventory.seed30,0);assert.equal(p.hp,hp);
 p.ki=0;g.action('p',{type:'atribuirConsumivelHotkey',slot:7,item:'ki'});assert.equal(g.action('p',{type:'usarConsumivelHotkey',slot:7}).ok,true);assert.equal(p.inventory.ki,3);
 assert.equal(g.action('p',{type:'usarConsumivelHotkey',slot:7}).ok,false);assert.equal(p.inventory.ki,3);
});
test('comida usa efeito existente, e configuração persiste sem mudar automação',()=>{
 const {g,p}=cena();g.action('p',{type:'atribuirConsumivelHotkey',slot:8,item:'food'});
 assert.equal(g.action('p',{type:'usarConsumivelHotkey',slot:8}).ok,true);assert.equal(p.inventory.food,4);assert.ok(p.foodUntil>g.time);
 assert.equal(g.action('p',{type:'usarConsumivelHotkey',slot:8}).ok,false);assert.equal(p.inventory.food,4);
 const volta=createPlayer('p',p.name,exportPlayer(p),g.time);assert.deepEqual(volta.hotkeysConsumiveis,p.hotkeysConsumiveis);assert.equal(volta.seedSelected,p.seedSelected);
 assert.deepEqual(g.snapshot('p').self.hotkeysConsumiveis,p.hotkeysConsumiveis);
});
test('save antigo e valores inválidos recebem padrão seguro',()=>{
 assert.deepEqual(createPlayer('p','Teste',{seedSelected:50}).hotkeysConsumiveis,{7:'seed50',8:'ki'});
 assert.deepEqual(createPlayer('p','Teste',{hotkeysConsumiveis:{7:'scrap',8:'seed99'}}).hotkeysConsumiveis,{7:'seed15',8:'ki'});
 const {g,p}=cena();p.hp=0;assert.equal(g.action('p',{type:'usarConsumivelHotkey',slot:7}).ok,false);assert.equal(p.inventory.seed15,2);
});
test('devolver atalho à mochila deixa slot vazio sem alterar estoque ou recarga',()=>{
 const {g,p}=cena();const antes=JSON.stringify(p.inventory);p.seedReady=1050;
 assert.equal(g.action('p',{type:'removerConsumivelHotkey',slot:7,item:'seed15'}).ok,true);
 assert.equal(p.hotkeysConsumiveis[7],null);assert.equal(JSON.stringify(p.inventory),antes);assert.equal(p.seedReady,1050);
 assert.equal(g.action('p',{type:'usarConsumivelHotkey',slot:7}).ok,false);
 assert.equal(g.snapshot('p').self.hotkeysConsumiveis[7],null);
 assert.equal(createPlayer('p',p.name,exportPlayer(p),g.time).hotkeysConsumiveis[7],null);
 assert.equal(g.action('p',{type:'atribuirConsumivelHotkey',slot:7,item:'ki'}).ok,true);assert.equal(p.hotkeysConsumiveis[7],'ki');
});
test('arrasto antigo não remove item novo nem aceita slot inválido',()=>{
 const {g,p}=cena();g.action('p',{type:'atribuirConsumivelHotkey',slot:7,item:'ki'});
 assert.equal(g.action('p',{type:'removerConsumivelHotkey',slot:7,item:'seed15'}).ok,false);assert.equal(p.hotkeysConsumiveis[7],'ki');
 assert.equal(g.action('p',{type:'removerConsumivelHotkey',slot:6,item:'ki'}).ok,false);
 assert.equal(g.action('p',{type:'removerConsumivelHotkey',slot:8,item:'ki'}).ok,true);
 assert.equal(g.action('p',{type:'removerConsumivelHotkey',slot:8,item:'ki'}).ok,false);
});