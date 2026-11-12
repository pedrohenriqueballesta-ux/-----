import test from 'node:test';
import assert from 'node:assert/strict';
import {avaliarResgateLote} from '../public/shared/resgate-lote.mjs';

test('resgate em lote calcula o espaço total e informa quanto falta',()=>{
 const r=avaliarResgateLote([{itens:{food:2,ki:1}},{itens:{seed15:1}}],10,10.5);
 assert.ok(Math.abs(r.pesoRecompensas-.98)<1e-9);
 assert.ok(Math.abs(r.faltam-.48)<1e-9);
 assert.equal(r.lotara,false);
});

test('resgate em lote pede confirmação quando os itens ocupam a capacidade restante',()=>{
 const r=avaliarResgateLote([{itens:{crystal:2}}],19.1,20);
 assert.ok(Math.abs(r.pesoRecompensas-.9)<1e-9);
 assert.equal(r.faltam,0);
 assert.equal(r.lotara,true);
});

test('resgate sem itens não alerta sobre capacidade',()=>{
 const r=avaliarResgateLote([{zeni:100,xp:20}],20,20);
 assert.equal(r.pesoRecompensas,0);
 assert.equal(r.faltam,0);
 assert.equal(r.lotara,false);
});
