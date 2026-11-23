import { GALICK } from '../../shared/tecnicas/galick-gun.mjs';
import { BIG_BANG_ATTACK, formaBigBangAttack } from '../../shared/tecnicas/big-bang-attack.mjs';
import { FINAL_FLASH, formaFinalFlash } from '../../shared/tecnicas/final-flash.mjs';
import {TECNICAS,tecnicaPorId,barraValida,acaoDaTecnica,tecnicaDisponivel,tecnicaDaVocacao,nivelDaTecnica,NOMES_TECNICAS_VEGETA} from '../../shared/tecnicas/barra-tecnicas.mjs';
import {formasDaVocacao,formaDisponivel,iconeDaForma} from '../../shared/tecnicas/formas.mjs';
import {curaPorNivel} from '../../shared/tecnicas/cura.mjs';
import {RYUKEN} from '../../shared/tecnicas/ryuken.mjs';
import {SUPER_KAME} from '../../shared/tecnicas/kamehameha.mjs';

let slots=[],acao=null,estado=null,instalado=false;
const trilho=()=>document.querySelector('.hud-tecnicas-trilho');
const formaMostrada = s => formasDaVocacao(s?.vocacao).find(f => f.forma === s?.forma)
  || formaDisponivel(s?.level || 1, s?.vocacao) || formasDaVocacao(s?.vocacao)[0];
const icone=(t,s)=>{
 const f=t.id==='form:auto'?formaMostrada(s):null;
 const forma = f?.forma || (t.id.startsWith('form:') ? t.id.slice(5) : null);
 const imagem=forma?iconeDaForma(forma,s?.vocacao||'goku'):t.imagem;
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
 for(let i=0;i<8;i++){
  let b=root.children[i];if(!b){b=document.createElement('button');b.type='button';b.className='tecnica';b.dataset.barraSlot=String(i);root.append(b);}
  const id=slots[i],t=tecnicaPorId(id),f=t?.id==='form:auto'?formaMostrada(estado):null;
  const nome=(id==='skill:galick'&&estado?.galickVersao?'Galick Gun V'+estado.galickVersao:f?.nome)||(estado?.vocacao==='vegeta'?NOMES_TECNICAS_VEGETA[id]||t?.nome:t?.nome)||'Vazio',nivel=f?.nivel??(t?nivelDaTecnica(t,estado?.vocacao):1),galick=id==='skill:galick', bloqueada=Boolean(t&&(estado?.level<nivel||!tecnicaDaVocacao(id,estado?.vocacao))), finalFlash=id==='skill:finalFlash', bigBang=id==='skill:bigBangAttack', semKi=(galick&&estado?.ki<GALICK.custo)||(finalFlash&&estado?.ki<FINAL_FLASH.custo)||(bigBang&&estado?.ki<BIG_BANG_ATTACK.custo);
  if(b.dataset.tecnica!==(id||'')){b.dataset.tecnica=id||'';delete b.dataset.formIcon;if(id)b.dataset.skill=id;else b.removeAttribute('data-skill');b.replaceChildren();const k=document.createElement('kbd');k.textContent=String(i+1);b.append(k);if(t)b.append(icone(t,estado));else{const vazio=document.createElement('span');vazio.className='tecnica-icone slot-vazio';b.append(vazio);}const strong=document.createElement('strong');strong.textContent=nome;b.append(strong);const small=document.createElement('small');b.append(small);}
  if (id?.startsWith('form:')) {
   const chaveIcone = (estado?.vocacao || 'goku') + ':' + (f?.forma || id);
   if (b.dataset.formIcon !== chaveIcone) {
    b.querySelector('.tecnica-icone').replaceWith(icone(t,estado));
    b.dataset.formIcon = chaveIcone;
   }
  }
  b.querySelector('strong').textContent=nome;
  const item=id?.startsWith('item:')?id.slice(5):null;
  const quantidade=item?estado?.inventory?.[item]||0:null;
  const restante=item==='ki'?estado?.kiRemaining:item==='food'?Math.max(0,(estado?.foodRemaining||0)-1):item?.startsWith('seed')?estado?.seedRemaining:galick?estado?.galickRemaining:finalFlash?estado?.finalFlashRemaining:bigBang?estado?.bigBangAttackRemaining:id==='skill:kame'?estado?.kameRemaining:id==='skill:barrier'?estado?.barrierRemaining:id==='skill:genki'?estado?.genkiRemaining:id==='skill:ryuken'?estado?.ryukenRemaining:id==='skill:superKamehameha'?estado?.superKameRemaining:0;
  const formaRequerida = (finalFlash && !formaFinalFlash(estado?.forma)) || (bigBang && !formaBigBangAttack(estado?.forma)) ? 'SSJ1 ou superior'
    : id==='skill:ryuken' && !RYUKEN.formas.includes(estado?.forma) ? 'SSJ3 ou SSJ4'
    : id==='skill:superKamehameha' && estado?.forma!==SUPER_KAME.forma ? 'SSJ4' : null;
  const formaIncorreta = Boolean(formaRequerida);
  b.classList.toggle('locked',bloqueada||semKi);b.classList.toggle('cooling',Boolean(restante>0));b.classList.toggle('consumivel-vazio',!id);b.classList.toggle('consumivel-indisponivel',Boolean(item&&(!quantidade||restante>0)));
  b.classList.toggle('consumivel-slot',Boolean(item));
  b.classList.toggle('fora-da-forma',Boolean(formaIncorreta));
  b.classList.toggle('active',Boolean(id?.startsWith('form:')&&estado?.forma!=='base'&&(id==='form:auto'||id==='form:'+estado?.forma)));
  b.draggable=Boolean(id);b.disabled=false;
  b.querySelector('small').textContent=t?bloqueada?((galick||finalFlash||bigBang)&&estado?.vocacao!=='vegeta'?'Vegeta':'NV. '+nivel):item?`${quantidade}${restante>0?' · '+Math.ceil(restante)+'s':''}`:restante>0?Math.ceil(restante)+'s':semKi?'Ki insuficiente':t.custo:'';
  b.title=t?`${nome} · Nv. ${nivel} · ${t.custo} · recarga ${t.recarga}${formaIncorreta?' · requer '+formaRequerida:''}`:'Slot vazio · arraste uma técnica';
  b.setAttribute('aria-label',`Tecla ${i+1}: ${nome}${bloqueada?' · bloqueada até o nível '+nivel:formaIncorreta?' · requer transformação':''}`);
 }
}
export function instalarBarraTecnicas(enviarAcao){
 if(instalado)return;instalado=true;acao=enviarAcao;const root=trilho();root.replaceChildren();slots=barraValida(null);
 root.addEventListener('click',e=>{const b=e.target.closest('[data-barra-slot]');if(!b)return;const id=slots[Number(b.dataset.barraSlot)];if(tecnicaDisponivel(id,estado)){const uso=acaoDaTecnica(id);if(uso)acao(uso);}});
 root.addEventListener('dragstart',e=>{const b=e.target.closest('[data-barra-slot]');if(!b||!slots[Number(b.dataset.barraSlot)]){e.preventDefault();return;}e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-dbi-barra',b.dataset.barraSlot);});
 root.addEventListener('dragover',e=>{if(e.target.closest('[data-barra-slot]')&&['application/x-dbi-barra','application/x-dbi-tecnica','application/x-dbi-consumivel'].some(t=>e.dataTransfer.types.includes(t))){e.preventDefault();e.dataTransfer.dropEffect='move';}});
 root.addEventListener('drop',e=>{
  const b=e.target.closest('[data-barra-slot]');if(!b)return;e.preventDefault();e.stopPropagation();const destino=Number(b.dataset.barraSlot),novos=[...slots],origem=e.dataTransfer.getData('application/x-dbi-barra');
  if(origem!==''){const i=Number(origem);[novos[i],novos[destino]]=[novos[destino],novos[i]];enviar(novos);return;}
  const item=e.dataTransfer.getData('application/x-dbi-consumivel');const id=e.dataTransfer.getData('application/x-dbi-tecnica')||(item?'item:'+item:null),t=tecnicaPorId(id);
  if(!t||estado?.level<nivelDaTecnica(t,estado?.vocacao)||!tecnicaDaVocacao(id,estado?.vocacao))return;
  const anterior=novos.indexOf(id);if(anterior>=0)novos[anterior]=novos[destino];novos[destino]=id;enviar(novos);
 });
}
export function atualizarBarraTecnicas(s){estado=s;slots=barraValida(s.barraTecnicas,s.hotkeysConsumiveis,s.seedSelected);desenhar();}
export function dadosTecnica(t,s){
 if(t.id==='skill:heal'){const cura=s?.cura||curaPorNivel(s?.level||1);return {...t,custo:`${cura.custo} Ki`,recarga:`${cura.cooldown} s`};}
 return t;
}
export {TECNICAS};
