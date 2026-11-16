import {TECNICAS,tecnicaPorId,barraValida,acaoDaTecnica} from '../shared/barra-tecnicas.mjs';
import {FORMAS,formaDisponivel} from '../shared/formas.mjs';
import {curaPorNivel} from '../shared/cura.mjs';
import {RYUKEN} from '../shared/ryuken.mjs';
import {SUPER_KAME} from '../shared/kamehameha.mjs';

let slots=[],acao=null,estado=null,instalado=false;
const trilho=()=>document.querySelector('.hud-tecnicas-trilho');
const icone=(t,s)=>{
 const f=t.id==='form:auto'?(FORMAS.find(f=>f.forma===s?.forma)||formaDisponivel(s?.level||1)):null;
 const imagem=f?.icone||t.imagem;
 const span=document.createElement('span');span.className='tecnica-icone '+(imagem?'consumivel-personalizado':t.icone||'sprite-kame');span.setAttribute('aria-hidden','true');
 if(imagem)span.style.backgroundImage=`url("${imagem}")`;
 return span;
};
function enviar(novos){
 const validada=barraValida(novos);if(validada.some((v,i)=>v!==novos[i]))return;
 slots=validada;acao?.({type:'configurarBarra',slots:[...slots]});desenhar();
}
function desenhar(){
 const root=trilho();if(!root)return;
 for(let i=0;i<9;i++){
  let b=root.children[i];if(!b){b=document.createElement('button');b.type='button';b.className='tecnica';b.dataset.barraSlot=String(i);root.append(b);}
  const id=i===8?'skill:superKamehameha':slots[i],t=tecnicaPorId(id),f=t?.id==='form:auto'?(FORMAS.find(f=>f.forma===estado?.forma)||formaDisponivel(estado?.level||1)):null;
  const nome=f?.nome||t?.nome||'Vazio',nivel=t?.nivel||1,bloqueada=Boolean(t&&estado?.level<nivel);
  if(b.dataset.tecnica!==(id||'')){b.dataset.tecnica=id||'';delete b.dataset.formIcon;if(id)b.dataset.skill=id;else b.removeAttribute('data-skill');b.replaceChildren();const k=document.createElement('kbd');k.textContent=String(i+1);b.append(k);if(t)b.append(icone(t,estado));else{const vazio=document.createElement('span');vazio.className='tecnica-icone consumivel-personalizado';b.append(vazio);}const strong=document.createElement('strong');strong.textContent=nome;b.append(strong);const small=document.createElement('small');b.append(small);}
  if(f){b.querySelector('strong').textContent=nome;if(b.dataset.formIcon!==f.forma){b.querySelector('.tecnica-icone').replaceWith(icone(t,estado));b.dataset.formIcon=f.forma;}}
  const item=id?.startsWith('item:')?id.slice(5):null;
  const quantidade=item?estado?.inventory?.[item]||0:null;
  const restante=item==='ki'?estado?.kiRemaining:item==='food'?Math.max(0,(estado?.foodRemaining||0)-1):item?.startsWith('seed')?estado?.seedRemaining:id==='skill:kame'?estado?.kameRemaining:id==='skill:barrier'?estado?.barrierRemaining:id==='skill:genki'?estado?.genkiRemaining:id==='skill:ryuken'?estado?.ryukenRemaining:id==='skill:superKamehameha'?estado?.superKameRemaining:0;
  const formaIncorreta=id==='skill:ryuken'&&!RYUKEN.formas.includes(estado?.forma)||id==='skill:superKamehameha'&&estado?.forma!==SUPER_KAME.forma;
  b.classList.toggle('locked',bloqueada);b.classList.toggle('cooling',Boolean(restante>0));b.classList.toggle('consumivel-vazio',!id);b.classList.toggle('consumivel-indisponivel',Boolean(item&&(!quantidade||restante>0)));
  b.classList.toggle('fora-da-forma',Boolean(formaIncorreta));
  b.classList.toggle('active',Boolean(id?.startsWith('form:')&&estado?.forma!=='base'&&(id==='form:auto'||id==='form:'+estado?.forma)));
  b.draggable=Boolean(id&&i<8);b.disabled=false;
  b.querySelector('small').textContent=t?bloqueada?'NV. '+nivel:item?`${quantidade} un.${restante>0?' · '+Math.ceil(restante)+'s':''}`:restante>0?Math.ceil(restante)+'s':t.custo:'';
  b.title=t?`${nome} · Nv. ${nivel} · ${t.custo} · recarga ${t.recarga}${formaIncorreta?' · requer '+(id==='skill:ryuken'?'SSJ3 ou SSJ4':'SSJ4'):''}`:'Slot vazio · arraste uma técnica';
  b.setAttribute('aria-label',`Tecla ${i+1}: ${nome}${bloqueada?' · bloqueada até o nível '+nivel:formaIncorreta?' · requer transformação':''}`);
 }
}
export function instalarBarraTecnicas(enviarAcao){
 if(instalado)return;instalado=true;acao=enviarAcao;const root=trilho();root.replaceChildren();slots=barraValida(null);
 root.addEventListener('click',e=>{const b=e.target.closest('[data-barra-slot]');if(!b)return;const i=Number(b.dataset.barraSlot),id=i===8?'skill:superKamehameha':slots[i],t=tecnicaPorId(id);if(t&&estado?.level>=t.nivel){const uso=acaoDaTecnica(id);if(uso)acao(uso);}});
 root.addEventListener('dragstart',e=>{const b=e.target.closest('[data-barra-slot]');if(!b||Number(b.dataset.barraSlot)>=8||!slots[Number(b.dataset.barraSlot)]){e.preventDefault();return;}e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-dbi-barra',b.dataset.barraSlot);});
 root.addEventListener('dragover',e=>{const b=e.target.closest('[data-barra-slot]');if(b&&Number(b.dataset.barraSlot)<8&&['application/x-dbi-barra','application/x-dbi-tecnica','application/x-dbi-consumivel'].some(t=>e.dataTransfer.types.includes(t))){e.preventDefault();e.dataTransfer.dropEffect='move';}});
 root.addEventListener('drop',e=>{
  const b=e.target.closest('[data-barra-slot]');if(!b||Number(b.dataset.barraSlot)>=8)return;e.preventDefault();e.stopPropagation();const destino=Number(b.dataset.barraSlot),novos=[...slots],origem=e.dataTransfer.getData('application/x-dbi-barra');
  if(origem!==''){const i=Number(origem);[novos[i],novos[destino]]=[novos[destino],novos[i]];enviar(novos);return;}
  const item=e.dataTransfer.getData('application/x-dbi-consumivel');const id=e.dataTransfer.getData('application/x-dbi-tecnica')||(item?'item:'+item:null),t=tecnicaPorId(id);
  if(!t||estado?.level<t.nivel)return;
  const anterior=novos.indexOf(id);if(anterior>=0)novos[anterior]=novos[destino];novos[destino]=id;enviar(novos);
 });
}
export function atualizarBarraTecnicas(s){estado=s;slots=barraValida(s.barraTecnicas,s.hotkeysConsumiveis,s.seedSelected);desenhar();}
export function dadosTecnica(t,s){
 if(t.id==='skill:heal'){const cura=s?.cura||curaPorNivel(s?.level||1);return {...t,custo:`${cura.custo} Ki`,recarga:`${cura.cooldown} s`};}
 return t;
}
export {TECNICAS};
