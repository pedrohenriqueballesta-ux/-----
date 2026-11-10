import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Game,CHEFES,SOCA_E_ATIRA} from '../public/shared/game.mjs';
import {PLANETS,PORTAIS,ZONES,DECORACAO,areaPorId,lugar,naEscala,naZonaSegura,zonaSeguraDaHunt,RAIO_PORTAL} from '../public/shared/config.mjs';
import {emTerra,pesLivres,deslocar,caminhoPorTerra} from '../public/shared/passagem.mjs';
import {spawnPoints,CHEFES_RAROS,TEMPO_CHEFE_RARO,pontoNoCirculo,mobStats} from '../public/shared/enemies.mjs';
import {PROJETEIS_POR_MOB} from '../public/shared/projetil-mob.mjs';
import {criarBestiario} from '../public/shared/bestiario.mjs';
import {RECOMPENSAS_MOBS} from '../public/shared/recompensas-mobs.mjs';
import {FOLHAS_NAMEK_NORTE} from '../public/art/namek-norte.mjs';
import {duelo,caca} from '../ferramentas/simular_namek_norte.mjs';
globalThis.Image=class {complete=true;naturalWidth=1024;};
const {LUTADORES,drawLutador}=await import('../public/art/lutadores.mjs');
const {art}=await import('../public/art/assets.mjs');
const {DIRECTIONS}=await import('../public/render/camera.mjs');
const passar=(g,s)=>{for(let i=0;i<Math.round(s/.05);i++)g.tick(.05);};
function cena(){const g=new Game({now:1000,populate:false,random:()=>.5}),p=g.addPlayer('p','Teste',{level:35});g.levar(p,lugar('norte'));p.x=naEscala(2730);p.y=naEscala(400);p.seguroAte=0;p.autoFood=p.autoHeal=false;return{g,p};}

test('Cratera de Nail usa a ilha norte com ID, cor e faixa provisória; outras caixas permanecem iguais',()=>{
  const z=areaPorId('norte');assert.equal(z.name,'Cratera de Nail');assert.deepEqual(z.nivel,[30,40]);assert.equal(z.cor,'#a35cff');
  assert.deepEqual([z.x,z.y,z.w,z.h].map(n=>Math.round(n/1.8)),[2058,72,1322,568]);assert.equal(z.planet,'namek');
  assert.deepEqual(PLANETS.namek.hunts,['inicial','media','dificil','norte']);
  for(const [id,caixa] of [['inicial',[1150,640,2230,1160]],['media',[1150,1800,3150,1272]],['dificil',[3380,500,1228,1300]]]) {
    const a=areaPorId(id);assert.deepEqual([a.x,a.y,a.w,a.h].map(n=>Math.round(n/1.8)),caixa);
  }
});
test('chegada e safe zone inteiras em chão caminhável; saída −60/−60 e portal da Vila acessíveis',()=>{
  const z=areaPorId('norte'),q=zonaSeguraDaHunt(z.id),saida=PORTAIS.find(p=>p.id==='saida-norte'),entrada=PORTAIS.find(p=>p.id==='vila-norte');
  for(let y=q.y;y<=q.y+q.h;y+=10)for(let x=q.x;x<=q.x+q.w;x+=10)assert.ok(pesLivres('namek',x,y,15,z.id));
  assert.equal(saida.x,z.chegada.x-60);assert.equal(saida.y,z.chegada.y-60);assert.ok(naZonaSegura(saida));
  assert.ok(Math.hypot(saida.x-z.chegada.x,saida.y-z.chegada.y)>RAIO_PORTAL+15);
  assert.ok(caminhoPorTerra('namek',areaPorId('vila').chegada,entrada,'vila'));
  for(const tp of PORTAIS.filter(p=>p.area==='vila'&&p!==entrada))assert.ok(Math.hypot(tp.x-entrada.x,tp.y-entrada.y)>230);
  for(const d of DECORACAO)assert.ok(Math.hypot(d.x-entrada.x,d.y-entrada.y)>=260);
  const {g,p}=cena();g.levar(p,lugar('vila'));p.x=entrada.x;p.y=entrada.y;assert.ok(g.usePortal(p,'norte').ok);assert.equal(p.area,'norte');assert.ok(g.protegido(p));
  p.x=saida.x;p.y=saida.y;assert.ok(g.usePortal(p,'vila').ok);assert.equal(p.area,'vila');
});
test('faixa de terra sul é fechada nos dois sentidos pelo limite da área, inclusive no movimento do servidor',()=>{
  const x=naEscala(2600),corte=naEscala(640);
  assert.ok(emTerra('namek',x,corte-20));assert.ok(emTerra('namek',x,corte+20));
  for(const [area,y,dy] of [['norte',naEscala(615),1],['inicial',naEscala(675),-1]]) {
    let py=y;for(let i=0;i<50;i++)[,py]=deslocar('namek',x,py,0,dy,10,15,area);
    assert.ok(area==='norte'?py<corte:py>corte);
    const {g,p}=cena();p.area=area;p.x=x;p.y=y;for(let i=0;i<50;i++)g.move(p,0,dy,.05,200);
    assert.ok(area==='norte'?p.y<corte:p.y>corte);assert.equal(p.area,area);
  }
});
test('população nova contém oito Nails, oito Piccolos e Neva raro; só nasce no norte com folga do corpo',()=>{
  for(const aleatorio of [()=>0,()=>.5,()=>.999]) {
    const pontos=spawnPoints(aleatorio),novos=pontos.filter(m=>['nail','piccoloDaimaoh','neva'].includes(m.type));
    assert.equal(novos.filter(m=>m.type==='nail').length,8);assert.equal(novos.filter(m=>m.type==='piccoloDaimaoh').length,8);assert.equal(novos.filter(m=>m.type==='neva').length,1);
    for(const m of novos){assert.equal(m.area,'norte');assert.equal(naZonaSegura({...m,planet:'namek'}),false);assert.ok(pesLivres('namek',m.x,m.y,(22+mobStats(m.type,'norte').corpo)/.6,'norte'));}
  }
});
test('Neva nasce na cratera em 10 s com opção de teste, avisa só a hunt e segue tempo raro configurado',()=>{
  const g=new Game({now:1000,random:()=>.5,chefeJa:true}),p=g.addPlayer('norte'),outro=g.addPlayer('outro');g.levar(p,lugar('norte'));g.levar(outro,lugar('inicial'));
  const n=[...g.mobs.values()].find(m=>m.type==='neva');assert.ok(n.raro);assert.equal(n.hp,0);assert.equal(n.deadUntil-g.time,10);assert.ok(CHEFES.has(n.type));
  passar(g,10.05);assert.ok(n.hp>0);const c=CHEFES_RAROS.norte;assert.ok(Math.hypot(n.x-c.x,n.y-c.y)<=c.r+1);
  assert.ok(g.events.some(e=>e.playerId===p.id&&e.text?.includes('Neva')));assert.equal(g.events.some(e=>e.playerId===outro.id&&e.text?.includes('Neva')),false);
  assert.deepEqual(TEMPO_CHEFE_RARO.neva,{minimo:2700,maximo:5400});
  const ponto=pontoNoCirculo(()=>.5,'norte');assert.ok(Math.hypot(ponto.x-c.x,ponto.y-c.y)<=c.r);
});
for(const tipo of ['nail','piccoloDaimaoh','neva']) {
  test(tipo+': corpo próprio, magia/ataque curto e rajada TARGET com a cor da folha',()=>{
    const {g,p}=cena(),m=g.addMob(tipo,p.x+75,p.y,'norte');m.attackReady=g.time;
    assert.ok(m.corpo>=34);assert.ok(SOCA_E_ATIRA.has(tipo));assert.ok(m.projetil);assert.equal(m.projetil.cor,PROJETEIS_POR_MOB[tipo].cor);
    g.tick(.05);assert.equal(m.telegraph.kind,'area');
    m.telegraph=null;m.attackReady=g.time;m.x=m.homeX=p.x+240;g.tick(.05);assert.equal(m.telegraph.kind,'shot');
    passar(g,.85);const tiro=g.projectiles.find(s=>s.owner===m.id);assert.ok(tiro);assert.equal(tiro.kind,'mobKiTarget');assert.equal(tiro.alvoId,p.id);
  });
  test(tipo+': aproximação para antes do centro do Goku e respeita o próprio corpo',()=>{
    const {g,p}=cena();p.godmode=true;const m=g.addMob(tipo,p.x+240,p.y,'norte');m.attackReady=Infinity;
    passar(g,6);const d=Math.hypot(m.x-p.x,m.y-p.y);assert.ok(d>=m.corpo+45,'não ocupa o centro do jogador');assert.ok(d<240,'se aproximou');
  });
}
test('nada vaza para Planícies ou Vegeta: dano, alvo, projétil e snapshot',()=>{
  const {g,p}=cena(),m=g.addMob('nail',p.x+150,p.y,'norte'),outro=g.addPlayer('outro');g.levar(outro,lugar('inicial'));Object.assign(outro,{x:p.x,y:p.y});
  assert.equal(g.hit(m,outro,100),false);assert.equal(g.mesmoLugar(m,outro),false);assert.equal(g.snapshot(outro.id).mobs.some(a=>a.id===m.id),false);
  g.dispararProjetilMob(m,p.id);g.levar(p,lugar('vegeta-planicies'));g.tick(.05);assert.equal(g.projectiles.some(a=>a.owner===m.id),false);
});
test('bestiário registra as três fichas, magia de Neva, recompensas padrão e retratos',()=>{
  const g=new Game({random:()=>.5}),fichas=criarBestiario(g.mobs.values()).filter(m=>m.area==='norte');assert.equal(fichas.length,3);
  const n=fichas.find(m=>m.tipo==='neva');assert.equal(n.raro,true);assert.match(n.ataques,/Magia da mão/);assert.deepEqual(n.zeni,[RECOMPENSAS_MOBS.zeniChefe,RECOMPENSAS_MOBS.zeniChefe]);
  for(const f of fichas){assert.equal(f.nomePlaneta,'Namekusei');assert.deepEqual(f.recomendado,[30,40]);assert.ok(f.xp>0);assert.equal(f.drops.length,3);assert.ok(FOLHAS_NAMEK_NORTE[f.tipo]);}
});
test('nove folhas 5×4 com âncoras nos pés, PNGs completos e todos os três inimigos com 2× Goku',async()=>{
  for(const [tipo,estados]of Object.entries(FOLHAS_NAMEK_NORTE)) {
    assert.equal(LUTADORES[tipo].altura,70*2);
    for(const [f]of Object.values(estados)) {
      assert.equal(f.rows,5);assert.equal(f.columns,4);const png=await readFile(new URL('../public'+f.file,import.meta.url));
      assert.equal(png.readUInt32BE(16),f.width);assert.equal(png.readUInt32BE(20),f.height);
      for(const linha of f.frames){assert.equal(linha.length,4);assert.equal(new Set(linha.map(q=>q[5]-q[1])).size,1);for(const [x,y,w,h,ax,ay]of linha){assert.ok(ax>x&&ax<x+w&&ay>y&&ay<y+h);assert.ok(x+w<=f.width&&y+h<=f.height);}}
    }
  }
});
test('equilíbrio provisório: Nail cai no 30; Piccolo exige perto do 40; Neva não cai solo sem equipamento',()=>{
  assert.equal(duelo('nail','norte',30).resultado,'vence');
  assert.equal(duelo('piccoloDaimaoh','norte',30).resultado,'perde');
  assert.equal(duelo('piccoloDaimaoh','norte',35).resultado,'perde');
  assert.equal(duelo('piccoloDaimaoh','norte',40).resultado,'vence');
  assert.equal(duelo('neva','norte',40).resultado,'perde');
});
test('desenhista escolhe as nove folhas e mantém escala única entre andar, ataque e rajada nas oito direções',()=>{
  for(const [tipo,estados]of Object.entries(FOLHAS_NAMEK_NORTE))for(const acao of ['andar','ataque','rajada'])for(const direcao of DIRECTIONS) {
    const desenhos=[],ctx={save(){},restore(){},translate(){},scale(){},drawImage(...a){desenhos.push(a);}};
    assert.ok(drawLutador(ctx,tipo,100,200,acao==='andar',direcao,0,acao==='andar'?null:.6,100,acao==='rajada'));
    const d=desenhos[0];assert.equal(d[0],art[estados[acao][1]]);
    assert.ok(Math.abs(d[7]/d[3]-LUTADORES[tipo].altura/estados.andar[0].referenceHeight)<1e-9);
  }
});
test('Auto Hunt roda cinco minutos no norte, retoma após mortes e não enfrenta Neva automaticamente',()=>{
  const r=caca('norte',30);assert.ok(r.abates>0);assert.ok(r.mortes>0);
  const {g,p}=cena(),n=g.addMob('neva',p.x+80,p.y,'norte');p.autoHunt=true;g.tick(.05);assert.notEqual(p.targetId,n.id);assert.equal(n.hp,n.maxHp);
});
