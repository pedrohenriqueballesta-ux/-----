import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { estagioVisualGalick, origemVisualGalick, desenharGalickComProfundidade } from '../public/render/vfx/galick-gun.mjs';

const pasta = new URL('../public/assets/skills/galick-gun/evolucoes/', import.meta.url);
function tamanhoPng(arquivo) {
  const dados = readFileSync(new URL(arquivo, pasta));
  return [dados.readUInt32BE(16), dados.readUInt32BE(20)];
}

test('as cinco evoluções usam as folhas e dimensões próprias nos marcos existentes', () => {
  for (const [nivel, numero] of [[40,1],[80,2],[120,3],[160,4],[200,5],[1000,5]]) {
    const estagio = estagioVisualGalick(nivel);
    assert.equal(estagio.numero, numero);
    assert.deepEqual(tamanhoPng(estagio.arquivo), [estagio.largura * 4, estagio.altura * 4]);
  }
  assert.deepEqual(tamanhoPng('impacto.png'), [1304,1304]);
});

test('as âncoras de disparo das oito direções espelham os pontos anatômicos', () => {
  const pos = { x:500, y:500 };
  const e = origemVisualGalick(pos,{x:1,y:0});
  const w = origemVisualGalick(pos,{x:-1,y:0});
  assert.ok(Math.abs((e.x-pos.x)-(pos.x-w.x)) < 1e-9);
  assert.equal(e.y,w.y);
  for(const direcao of [{x:0,y:1},{x:1,y:1},{x:1,y:0},{x:1,y:-1},{x:0,y:-1},{x:-1,y:-1},{x:-1,y:0},{x:-1,y:1}]) {
    const mao = origemVisualGalick(pos,direcao);
    assert.ok(Number.isFinite(mao.x) && Number.isFinite(mao.y));
    assert.ok(mao.y < pos.y);
  }
});

test('o renderer recorta dentro dos atlas e desenha o impacto só no contato', () => {
  const antigo = globalThis.Image;
  globalThis.Image = class {
    set src(caminho) { this.file=caminho.split('/').at(-1);[this.naturalWidth,this.naturalHeight]=tamanhoPng(this.file);this.complete=true; }
  };
  try {
    const chamadas=[];
    const ctx={save(){},restore(){},translate(){},rotate(){},set imageSmoothingEnabled(_){},drawImage(...args){chamadas.push(args);}};
    for(const nivel of [40,80,120,160,200]) {
      for(const direction of [{x:0,y:1},{x:1,y:1},{x:1,y:0},{x:1,y:-1},{x:0,y:-1},{x:-1,y:-1},{x:-1,y:0},{x:-1,y:1}]) {
        const origem=origemVisualGalick({x:500,y:500},direction);
        for(const distancia of [32,170,380]) {
          chamadas.length=0;
          const contatoX=origem.x+direction.x*distancia, contatoY=origem.y+direction.y*distancia;
          desenharGalickComProfundidade(ctx,{...origem,nivel,direction,visualDirection:direction,
            started:-.64,alvoDistancia:distancia,alcanceVisualExtra:50,
            impacto:{started:0,contatoX,contatoY}},.24);
          assert.ok(chamadas.length>0);
          for(const [img,sx,sy,sw,sh,dx,dy,dw,dh] of chamadas){
            assert.ok(sx>=0 && sy>=0 && sx+sw<=img.naturalWidth+1e-6 && sy+sh<=img.naturalHeight+1e-6);
            assert.ok([dx,dy,dw,dh].every(Number.isFinite));
          }
          const impacto=chamadas.find(([img])=>img.file==='impacto.png');
          assert.ok(impacto);
          assert.ok(Math.abs(impacto[5]+impacto[7]/2-contatoX) < 1e-9);
          assert.ok(Math.abs(impacto[6]+impacto[8]/2-(contatoY-28)) < 1e-9);
        }
      }
    }
  } finally { globalThis.Image=antigo; }
});
