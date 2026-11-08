import test from 'node:test';
import assert from 'node:assert/strict';
import {removerFundoEscuro} from '../public/render/icones-animados.mjs';
test('remove apenas fundo escuro conectado à borda, preservando preto interno e cor da arte',()=>{
 const w=5,h=5,p=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)p.set([4,2,0,255],i*4);
 for(let y=1;y<4;y++)for(let x=1;x<4;x++)if(x===1||x===3||y===1||y===3)p.set([220,160,20,255],(y*w+x)*4);
 removerFundoEscuro(p,w,h);assert.equal(p[3],0);assert.equal(p[(2*w+2)*4+3],255);assert.equal(p[(1*w+1)*4+3],255);assert.deepEqual([...p.slice((1*w+1)*4,(1*w+1)*4+3)],[220,160,20]);
});
test('fundo já transparente não altera pixels coloridos',()=>{
 const p=new Uint8ClampedArray([0,0,0,0,40,30,20,255]);removerFundoEscuro(p,2,1);assert.deepEqual([...p],[0,0,0,0,40,30,20,255]);
});
