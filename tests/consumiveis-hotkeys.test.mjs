import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../public/shared/nucleo/game.mjs';
import {createPlayer,exportPlayer} from '../public/shared/nucleo/characters.mjs';
const cena=()=>{const g=new Game({now:1000,populate:false});return {g,p:g.addPlayer('p')};};
test('slots 7 e 8 recebem somente consumíveis existentes, sem gastar estoque',()=>{
 const {g,p}=cena();const antes=JSON.stringify(p.inventory);
 assert.equal(g.action('p',{type:'atribuirConsumivelHotkey',slot:7,item:'ki'}).ok,true);
 assert.equal(g.action('p',{type:'atribuirConsumivelHotkey',slot:8,item:'seed30'}).ok,true);
 assert.equal(JSON.stringify(p.inventory),antes);assert.deepEqual(p.hotkeysConsumiveis,{7:'ki',8:'seed30'});
 for(const dados of [{slot:1,item:'food'},{slot:6,item:'ki'},{slot:9,item:'ki'},{slot:'7',item:'ki'},{slot:7,item:'scrap'},{slot:7,item:'cristal-azul'},{slot:7,item:'seed99'},{slot:7,item:'__proto__'}])assert.equal(g.action('p',{type:'atribuirConsumivelHotkey',...dados}).ok,false);
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

test('comidas de loot usam efeitos próprios, compartilham o efeito de comida e são restauradas', () => {
  const g = new Game({ now: 1000, populate: false });
  const p = g.addPlayer('racao','Teste',{ level: 100, inventory:{ food:1, 'fruta-namek':1, 'carne-porunga':1, 'carne-oozaru':1 } });
  p.autoHunt = true; p.autoFood = false; p.autoHeal = false;
  p.hp = 50; p.ki = 20;
  const comer = item => g.action(p.id,{type:'usarConsumivel',item});
  assert.ok(comer('fruta-namek').ok);
  assert.equal(comer('carne-porunga').ok, false);
  assert.equal(g.action(p.id,{type:'food'}).ok, false);
  g.updatePlayer(p, 1);
  assert.equal(p.ki, 21);
  assert.equal(p.hp, 50);
  const restaurado = g.addPlayer('reconectou','Teste',g.exportPlayer(p));
  assert.equal(restaurado.foodId, 'fruta-namek');
  assert.equal(g.snapshot(restaurado.id).self.foodRemaining, 60);

  g.time += 61;
  assert.ok(comer('carne-porunga').ok);
  g.updatePlayer(p, 1);
  assert.equal(p.hp, 56);
  g.time += 61;
  assert.ok(comer('carne-oozaru').ok);
  g.updatePlayer(p, 1);
  assert.equal(p.hp, 61);
  assert.equal(p.ki, 24);
});

test('Poção de Energia pelo atalho recupera só HP e compartilha a recarga da Poção de Ki', () => {
  const g = new Game({ now: 1000, populate: false });
  const p = g.addPlayer('energia','Teste',{ level: 30, inventory:{ ki:2, 'pocao-energia':2 } });
  p.hp = 10; p.ki = 20;
  assert.ok(g.action(p.id,{type:'atribuirConsumivelHotkey',slot:8,item:'pocao-energia'}).ok);
  assert.ok(g.action(p.id,{type:'usarConsumivelHotkey',slot:8}).ok);
  assert.equal(p.hp, 10 + p.stats.hp * .15);
  assert.equal(p.ki, 20);
  assert.equal(p.inventory['pocao-energia'], 1);
  assert.equal(g.action(p.id,{type:'potion'}).ok, false);
  assert.equal(g.action(p.id,{type:'usarConsumivel',item:'garra-porunga'}).ok, false);
  assert.equal(p.inventory.ki, 2);

  g.time = p.kiReady;
  p.hp = p.stats.hp;
  assert.equal(g.action(p.id,{type:'usarConsumivel',item:'pocao-energia'}).ok, false);
  assert.equal(p.inventory['pocao-energia'], 1);
  p.hp -= 1;
  p.ki = p.stats.ki;
  assert.ok(g.action(p.id,{type:'usarConsumivel',item:'pocao-energia'}).ok);
  assert.equal(p.hp, p.stats.hp);
  assert.equal(p.ki, p.stats.ki);
});
