import {consumivelValido,hotkeysConsumiveisValidas} from '../shared/consumiveis-hotkeys.mjs';
import {ITENS_NEGOCIAVEIS} from '../shared/itens-negociaveis.mjs';
let arrastando=false,evitarCliqueAte=0;
const botoes=()=>[document.getElementById('seedButton'),document.getElementById('kiPotionButton')];
export function instalarConsumiveisHud(acao){
 botoes().forEach((b,i)=>{
  b.dataset.hotkeyConsumivel=String(i+7);b.onclick=()=>{if(!arrastando&&performance.now()>evitarCliqueAte&&b.dataset.item)acao({type:'usarConsumivelHotkey',slot:i+7});};
  b.addEventListener('dragstart',e=>{
    if(!consumivelValido(b.dataset.item)){e.preventDefault();return;}
    arrastando=true;e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('application/x-dbi-hotkey',JSON.stringify({slot:i+7,item:b.dataset.item}));
  });
  b.addEventListener('dragend',()=>{arrastando=false;evitarCliqueAte=performance.now()+300;document.getElementById('mochilaDialog')?.classList.remove('consumivel-destino');});
  b.addEventListener('dragover',e=>{if(!e.dataTransfer.types.includes('application/x-dbi-consumivel'))return;e.preventDefault();e.dataTransfer.dropEffect='copy';b.classList.add('consumivel-destino');});
  b.addEventListener('dragleave',()=>b.classList.remove('consumivel-destino'));
  b.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();b.classList.remove('consumivel-destino');const item=e.dataTransfer.getData('application/x-dbi-consumivel');if(consumivelValido(item))acao({type:'atribuirConsumivelHotkey',slot:i+7,item});});
 });
 const mochila=document.getElementById('mochilaDialog');
 mochila.addEventListener('dragover',e=>{if(!e.dataTransfer.types.includes('application/x-dbi-hotkey'))return;e.preventDefault();e.dataTransfer.dropEffect='move';mochila.classList.add('consumivel-destino');});
 mochila.addEventListener('dragleave',e=>{if(!mochila.contains(e.relatedTarget))mochila.classList.remove('consumivel-destino');});
 mochila.addEventListener('drop',e=>{
   if(!e.dataTransfer.types.includes('application/x-dbi-hotkey'))return;e.preventDefault();e.stopPropagation();mochila.classList.remove('consumivel-destino');
   try{const d=JSON.parse(e.dataTransfer.getData('application/x-dbi-hotkey'));if([7,8].includes(d.slot)&&consumivelValido(d.item))acao({type:'removerConsumivelHotkey',slot:d.slot,item:d.item});}catch{}
 });
}
export function atualizarConsumiveisHud(s){
 const slots=hotkeysConsumiveisValidas(s.hotkeysConsumiveis,s.seedSelected);
 botoes().forEach((b,i)=>{
  if(!b)return;const id=slots[i+7],item=ITENS_NEGOCIAVEIS[id];
  b.draggable=Boolean(item);b.classList.toggle('consumivel-vazio',!item);
  if(!item){
    delete b.dataset.item;b.disabled=false;b.classList.remove('cooling','consumivel-indisponivel');
    const icone=b.querySelector('.tecnica-icone');icone.className='tecnica-icone consumivel-personalizado';icone.style.backgroundImage='none';
    b.querySelector('strong').textContent='Vazio';b.querySelector('.contagem').textContent='';b.querySelector('.recarga-item').textContent='';
    b.setAttribute('aria-label','Slot '+(i+7)+' vazio · arraste um consumível da mochila');return;
  }
  b.dataset.item=id;
  const icone=b.querySelector('.tecnica-icone');icone.className='tecnica-icone consumivel-personalizado';icone.style.backgroundImage='url('+item.icone+')';
  b.querySelector('strong').textContent=item.nome;
  const quantidade=s.inventory[id]||0,restante=id==='ki'?s.kiRemaining:id==='food'?Math.max(0,(s.foodRemaining||0)-1):s.seedRemaining;
  b.querySelector('.contagem').textContent=quantidade;b.querySelector('.recarga-item').textContent=restante>0?Math.ceil(restante)+'s':'';
  // Não desabilitar o elemento: ele deve aceitar drop mesmo sem estoque ou em cooldown.
  b.disabled=false;b.classList.toggle('consumivel-indisponivel',!quantidade||restante>0);b.classList.toggle('cooling',restante>0);
  b.setAttribute('aria-label',item.nome+' · tecla '+(i+7)+' · '+quantidade+' unidades'+(restante>0?' · em recarga':''));
 });
}
