import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {Game,SOCA_E_ATIRA} from '../public/shared/game.mjs';
import {lugar} from '../public/shared/config.mjs';
import {mobStats} from '../public/shared/enemies.mjs';
import {ARTE_PROJETIL_MOB,configurarProjetilMob,iniciarVooTarget,avancarVooTarget,quadroProjetilMob} from '../public/shared/projetil-mob.mjs';
function cena(){
 const g=new Game({now:1000,populate:false}),p=g.addPlayer('p');g.levar(p,lugar('inicial'));p.x+=400;p.seguroAte=0;p.autoHeal=false;p.autoFood=false;p.hp=p.stats.hp=10000;
 const m=g.addMob('veterano',p.x-180,p.y,p.area);m.speed=0;m.attackReady=Infinity;
 return {g,p,m};
}
function passar(g,segundos){for(let t=0;t<segundos-1e-9;t+=.05)g.tick(.05);}

test('apenas espécies que já usavam Ki recebem configuração; golpes especiais ficam intactos',()=>{
 for(const tipo of [...SOCA_E_ATIRA,'ranged']){const c=mobStats(tipo).projetil;assert.ok(c);assert.equal(c.dano,mobStats(tipo).attack);assert.equal(c.velocidade,250);assert.equal(c.fps,12);}
 for(const tipo of ['melee','passaro','inseto','porunga','boss','subboss','freezaBoss','oozaruDourado'])assert.equal(mobStats(tipo).projetil,null,tipo);
 const original=mobStats('veterano').projetil,editado=configurarProjetilMob('veterano',{attack:20,projetil:{dano:51,velocidade:70,tamanho:64,cor:120,cooldown:3,alcance:400,fps:20}});
 assert.deepEqual(editado,{dano:51,velocidade:70,tamanho:64,cor:120,cooldown:3,alcance:400,fps:20});assert.equal(original.velocidade,250);
});

test('TARGET converge no prazo mesmo com velocidade inferior ao jogador, sem depender de distância percorrida',()=>{
 for(const velocidade of [10,50,250,800]){
  const alvo={x:200,y:0},s=iniciarVooTarget({x:0,y:0},alvo,{velocidade,dano:20,tamanho:48,cor:120,fps:12},0);let atingiu=false;
  for(let t=.05;t<=s.chegaEm+.05;t+=.05){alvo.x+=235*.05;alvo.y=180*Math.sin(t*5);atingiu=avancarVooTarget(s,alvo,t);if(atingiu)break;}
  assert.ok(atingiu,'velocidade '+velocidade);assert.ok(Math.hypot(s.x-alvo.x,s.y-alvo.y)<1e-6);
 }
});

test('movimentação manual corrige trajetória, não evita impacto e recebe dano exatamente uma vez',()=>{
 const {g,p,m}=cena(),antes=p.hp;assert.ok(g.dispararProjetilMob(m,p.id));const s=g.projectiles[0],direcao=s.dy;
 for(let i=0;i<20;i++){g.setInput(p.id,{x:i%2?1:-1,y:1});g.tick(.05);if(i===2)assert.notEqual(s.dy,direcao);}
 assert.ok(p.hp<antes);assert.equal(g.projectiles.length,0);
 const apos=p.hp;passar(g,1);assert.equal(p.hp,apos);
});

test('não acerta intermediários nem troca de alvo se o aggro mudar',()=>{
 const {g,p,m}=cena(),q=g.addPlayer('q');g.levar(q,lugar('inicial'));q.x=(m.x+p.x)/2;q.y=p.y;q.seguroAte=0;q.autoHeal=false;q.autoFood=false;
 const vida=q.hp;g.dispararProjetilMob(m,p.id);g.somarAmeaca(m,q,9999);passar(g,1);
 assert.equal(q.hp,vida);assert.ok(p.hp<10000);
});

test('morte, remoção, desconexão, proteção e troca de área invalidam o alvo sem dano',()=>{
 for(const modo of ['morte','remocao','desconexao','safe','area','protecao']){
  const {g,p,m}=cena();g.dispararProjetilMob(m,p.id);
  if(modo==='morte'){p.hp=0;p.respawnAt=g.time+10;}
  if(modo==='remocao')g.players.delete(p.id);
  if(modo==='desconexao')p.connected=false;
  if(modo==='safe')g.levar(p,lugar('inicial'));
  if(modo==='area')g.levar(p,lugar('media'));
  if(modo==='protecao')p.seguroAte=g.time+10;
  const hp=p.hp;g.tick(.05);assert.equal(g.projectiles.length,0,modo);assert.equal(p.hp,hp,modo);
 }
});

test('projétil disparado continua após morte do mob; falha com dono removido sem erro',()=>{
 for(const remover of [false,true]){
  const {g,p,m}=cena();g.dispararProjetilMob(m,p.id);m.hp=0;m.deadUntil=Infinity;
  if(remover)g.mobs.delete(m.id);passar(g,1);
  assert.equal(g.projectiles.length,0);assert.equal(p.hp<10000,!remover);
 }
});

test('esquiva manual não cancela TARGET; defesa e barreira continuam reduzindo o dano',()=>{
 const {g,p,m}=cena();p.dashUntil=g.time+10;p.dashDirection={x:1,y:0};p.barrierUntil=g.time+10;
 assert.equal(g.hit(m,p,m.attack),false,'outros ataques ainda respeitam dash');
 const previsto=Math.max(1,Math.round(m.projetil.dano*.28*100/(100+p.stats.defense*3)));
 g.dispararProjetilMob(m,p.id);passar(g,1);assert.equal(10000-p.hp,previsto);
});

test('compatível com caça automática sem interromper movimento ou gastar Ki do jogador',()=>{
 const {g,p,m}=cena();p.autoHunt=true;p.autoAttack=false;p.autoSkills=false;const x=p.x,ki=p.ki;
 g.dispararProjetilMob(m,p.id);passar(g,1);assert.notEqual(p.x,x);assert.equal(p.autoHunt,true);assert.ok(p.hp<10000);assert.equal(p.ki,ki);
});

test('alcance controla início, alvo fica travado na preparação e cooldown controla novo disparo',()=>{
 const {g,p,m}=cena();Object.assign(m.projetil,{alcance:100,cooldown:2.5,dano:70,velocidade:50,tamanho:64,cor:225,fps:18});m.attackReady=g.time;
 g.tick(.05);assert.equal(m.telegraph,null);
 m.projetil.alcance=220;g.tick(.05);assert.equal(m.telegraph.kind,'shot');assert.equal(m.telegraph.alvoId,p.id);
 const q=g.addPlayer('q');g.levar(q,lugar('inicial'));q.x=p.x;q.y=p.y+50;q.seguroAte=0;g.somarAmeaca(m,q,9999);
 const release=m.telegraph.until;while(m.telegraph && g.time<release+.1)g.tick(.05);
 const s=g.projectiles.find(s=>s.owner===m.id);assert.ok(s);assert.equal(s.alvoId,p.id);assert.equal(s.damage,70);assert.equal(s.fps,18);assert.equal(s.tamanho,64);assert.equal(s.cor,225);
 assert.ok(Math.abs(m.attackReady-(g.time+2.5))<1e-6);passar(g,1);assert.equal(g.projectiles.filter(s=>s.owner===m.id).length,1);
});

test('soco mantém dano e aviso originais; jogadores continuam com projétil Ki antigo',()=>{
 const {g,p,m}=cena();m.x=p.x-35;m.attackReady=g.time;m.projetil.dano=999;
 g.tick(.05);assert.equal(m.telegraph.kind,'area');const antes=p.hp;passar(g,.7);
 assert.ok(p.hp<antes);assert.ok(antes-p.hp<100);assert.equal(g.projectiles.length,0);
 p.level=2;p.charge=null;p.shotReady=0;p.ki=100;assert.ok(g.cast(p,'ki').ok);assert.equal(g.projectiles.at(-1).kind,'ki');assert.equal(g.projectiles.at(-1).ttl,.95);
});

test('animação tem oito quadros distintos em loop e pode mudar FPS por mob',()=>{
 assert.deepEqual(Array.from({length:8},(_,i)=>quadroProjetilMob((i+.1)/12)),[0,1,2,3,4,5,6,7]);
 assert.equal(quadroProjetilMob(8/12),0);assert.equal(quadroProjetilMob(.25,20),5);
});

test('spritesheet recomposta tem oito quadros RGBA visíveis e transparência',async()=>{
 const png=await readFile(new URL('../public'+ARTE_PROJETIL_MOB.arquivo,import.meta.url));
 const w=png.readUInt32BE(16),h=png.readUInt32BE(20);assert.deepEqual([w,h,png[24],png[25],png[28]],[2304,256,8,6,0]);
 const partes=[];for(let p=8;p<png.length;){const n=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')partes.push(png.subarray(p+8,p+8+n));p+=n+12;}
 const dados=inflateSync(Buffer.concat(partes)),stride=w*4,contagem=Array(8).fill(0),hashes=Array(8).fill(2166136261);let offset=0,anterior=Buffer.alloc(stride),transparentes=0;
 const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c};
 for(let y=0;y<h;y++){const filtro=dados[offset++],linha=Buffer.alloc(stride);for(let x=0;x<stride;x++){const a=x>=4?linha[x-4]:0,b=anterior[x],c=x>=4?anterior[x-4]:0;linha[x]=dados[offset++]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filtro];}
  for(let x=0;x<w;x++){const f=Math.floor(x/288),i=x*4;if(linha[i+3]>8)contagem[f]++;else transparentes++;for(let c=0;c<4;c++)hashes[f]=Math.imul(hashes[f]^linha[i+c],16777619);}
  anterior=linha;
 }
 assert.ok(contagem.every(n=>n>1000));assert.equal(new Set(hashes).size,8);assert.ok(transparentes>w*h/3);
});

test('renderização colore uma vez por tonalidade e rotaciona sem processar pixels por projétil',async()=>{
 const antigos={Image:globalThis.Image,document:globalThis.document};let preparados=0,desenhos=0;const giros=[];
 globalThis.Image=class{complete=true;naturalWidth=2304;naturalHeight=256;};
 globalThis.document={createElement(){preparados++;return{getContext(){return{drawImage(){}}}}}};
 try{const {desenharProjetilMob}=await import('../public/render/projetil-mob.mjs');const ctx={save(){},restore(){},translate(){},rotate(a){giros.push(a)},drawImage(){desenhos++}};
  for(let i=0;i<100;i++)assert.ok(desenharProjetilMob(ctx,{started:0,dx:0,dy:1,cor:i%2?105:225,fps:12,tamanho:48},{x:0,y:0},.1));
  assert.equal(preparados,2);assert.equal(desenhos,100);assert.ok(giros.every(g=>g===Math.PI/2));
  desenharProjetilMob(ctx,{started:0,dx:1,dy:0,cor:105,fps:12,tamanho:48},{x:0,y:0},.1,2);assert.equal(preparados,3,'zoom cria versão de maior resolução uma única vez');
 }finally{for(const[k,v]of Object.entries(antigos)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
