import {DIRECOES_NIMBUS,geometriaNimbus,direcaoNimbus} from '../shared/montarias.mjs';
import {ASSENTOS_MONTARIAS} from '../shared/montarias.mjs';
const sprites=new Map();let carregamento=null,pronta=false,repetirEm=0;
const rena={imgs:new Map(),camadas:new Map(),carregamento:null,cache:new Map()};
function carregarRena(){
 if(rena.carregamento)return rena.carregamento;
 const nomes=['parado','andando','invocacao'];
 const folhas=nomes.map(nome=>new Promise((ok,erro)=>{const i=new Image();i.onload=()=>{rena.imgs.set(nome,i);ok();};i.onerror=erro;i.src='/assets/montarias/rena-natalina/'+nome+'.png';}));
 const camadas=['back','front'].map(nome=>new Promise((ok,erro)=>{const i=new Image();i.onload=()=>{rena.camadas.set(nome,i);ok();};i.onerror=erro;i.src='/assets/montarias/rena-natalina/mount_'+nome+'.png';}));
 rena.carregamento=Promise.all([...folhas,...camadas]).then(()=>true).catch(e=>{rena.carregamento=null;throw e;});
 return rena.carregamento;
}
function renaImagem(img){if(rena.cache.has(img))return rena.cache.get(img);const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);const p=x.getImageData(0,0,c.width,c.height),d=p.data;for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];/* somente magenta próximo de #FF00FF; preserva vermelho, azul e sombras */if(r>150&&b>150&&g<140&&Math.abs(r-b)<90)d[i+3]=0;}x.putImageData(p,0,0);rena.cache.set(img,c);return c;}
function desenharRena(ctx,p,pos,t){
 if(!rena.imgs.size){carregarRena().catch(()=>{});return null;}
 const d=direcaoNimbus(p.facing||{x:0,y:1});
 // A folha fornece frente, diagonal direita, perfil, diagonal costas e costas.
 const row={s:0,se:1,e:2,ne:3,n:4,sw:1,w:2,nw:3}[d]??0,flip=d==='sw'||d==='w'||d==='nw';
 const trans=p.renaTransition,progresso=trans?Math.max(0,Math.min(1,(t-trans.inicio)/.65)):1;
 // Os frames da rena têm margem transparente abaixo dos cascos. A âncora do
 // mundo fica no chão; a compensação move a arte e o assento juntos.
 const piso=10;
 const nome=trans?'invocacao':p.moving?'andando':'parado',clean=renaImagem(rena.imgs.get(nome)),bounds=[0,307,614,922,1229,1536],col=trans?(trans.tipo==='invocar'?Math.min(3,Math.floor(progresso*4)):Math.max(0,3-Math.floor(progresso*4))):(p.moving?Math.floor(Math.max(0,t)*7)%4:0),sx=col*256,sy=bounds[row],sh=bounds[row+1]-sy,scale=.25;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=trans&&trans.tipo==='desinvocar'?1-progresso:1;ctx.translate(pos.x,pos.y);if(flip)ctx.scale(-1,1);
 // As camadas fornecidas ainda ficam isoladas no debug até passarem pela
 // reconstrução pixel a pixel da referência aprovada.
 const camadaParada=nome==='parado'&&p.renaCamadas===true&&rena.camadas.get('back')&&rena.camadas.get('front');
 if(camadaParada){const camadas=p.renaCamada? [p.renaCamada] : ['back','front'];for(const camada of camadas)ctx.drawImage(rena.camadas.get(camada),sx,sy,256,sh,-128*scale,-sh*scale+piso,256*scale,sh*scale);}
 else ctx.drawImage(clean,sx,sy,256,sh,-128*scale,-sh*scale+piso,256*scale,sh*scale);
 ctx.restore();
 const assento=ASSENTOS_MONTARIAS.rena_natalina[d]||{x:0,y:-30};
 return {personagem:{x:pos.x+assento.x,y:pos.y+assento.y+piso}};
}
export function carregarNimbus(){
 if(carregamento)return carregamento;
 carregamento=Promise.all(DIRECOES_NIMBUS.flatMap(d=>Array.from({length:5},(_,i)=>new Promise((ok,erro)=>{
  const img=new Image();img.onload=()=>{sprites.set(d+':'+i,img);ok();};img.onerror=()=>erro(Error('Não foi possível carregar Nimbus '+d+' '+(i+1)));img.src='/assets/montarias/nimbus/sprites/nimbus_'+d+'_0'+(i+1)+'.png?v=sem-faixas-1';
 })))).then(()=>{pronta=true;return true;}).catch(e=>{carregamento=null;repetirEm=performance.now()+5000;throw e;});return carregamento;
}
export function desenharNimbus(ctx,p,pos,t,opcoes={}){
 if(p.montaria==='rena_natalina'||p.renaTransition)return null;
 if(p.montaria!=='nimbus'||p.dead)return null;
 if(!pronta){if(performance.now()<repetirEm)return null;carregarNimbus().catch(()=>{});return null;}
 const g=geometriaNimbus(p,pos,t,opcoes),img=sprites.get(g.direcao+':'+g.quadro);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,g.nuvem.x,g.nuvem.y,g.nuvem.tamanho,g.nuvem.tamanho);ctx.restore();return g;
}
export const nimbusCarregada=()=>pronta;
