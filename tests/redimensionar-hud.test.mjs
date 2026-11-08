import test from 'node:test';
import assert from 'node:assert/strict';
import {limitarTamanhoHud,limitarEscalaHud} from '../public/render/redimensionar-hud.mjs';
test('tamanho das janelas respeita mínimos e limites da tela',()=>{
 assert.deepEqual(limitarTamanhoHud(50,40,{w:1000,h:800}),{w:220,h:160});
 assert.deepEqual(limitarTamanhoHud(5000,5000,{w:420,h:740}),{w:404,h:724});
 assert.deepEqual(limitarTamanhoHud(100,100,{w:180,h:140}),{w:164,h:124});
 assert.deepEqual(limitarTamanhoHud(NaN,Infinity,{w:1000,h:800}),{w:220,h:160});
});
test('escala mantém proporção e limita HUDs à área disponível',()=>{
 assert.equal(limitarEscalaHud(5,{w:300,h:100},{w:1000,h:800}),2);
 assert.equal(limitarEscalaHud(.1,{w:300,h:100},{w:1000,h:800}),.6);
 assert.equal(limitarEscalaHud(2,{w:800,h:100},{w:420,h:740}),404/800);
 assert.equal(limitarEscalaHud(2,{w:100,h:900},{w:420,h:740}),724/900);
 assert.equal(limitarEscalaHud(NaN,{w:300,h:100},{w:1000,h:800}),1);
});