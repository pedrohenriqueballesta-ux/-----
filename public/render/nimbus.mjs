import {DIRECOES_NIMBUS,geometriaNimbus} from '../shared/montarias.mjs';
const sprites=new Map();let carregamento=null,pronta=false,repetirEm=0;
export function carregarNimbus(){
 if(carregamento)return carregamento;
 carregamento=Promise.all(DIRECOES_NIMBUS.flatMap(d=>Array.from({length:5},(_,i)=>new Promise((ok,erro)=>{
  const img=new Image();img.onload=()=>{sprites.set(d+':'+i,img);ok();};img.onerror=()=>erro(Error('Não foi possível carregar Nimbus '+d+' '+(i+1)));img.src='/assets/montarias/nimbus/sprites/nimbus_'+d+'_0'+(i+1)+'.png?v=sem-faixas-1';
 })))).then(()=>{pronta=true;return true;}).catch(e=>{carregamento=null;repetirEm=performance.now()+5000;throw e;});return carregamento;
}
export function desenharNimbus(ctx,p,pos,t,opcoes={}){
 if(p.montaria!=='nimbus'||p.dead)return null;
 if(!pronta){if(performance.now()<repetirEm)return null;carregarNimbus().catch(()=>{});return null;}
 const g=geometriaNimbus(p,pos,t,opcoes),img=sprites.get(g.direcao+':'+g.quadro);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,g.nuvem.x,g.nuvem.y,g.nuvem.tamanho,g.nuvem.tamanho);ctx.restore();return g;
}
export const nimbusCarregada=()=>pronta;
