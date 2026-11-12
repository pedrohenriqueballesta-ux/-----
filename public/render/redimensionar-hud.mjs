// Tamanho independente por painel; nenhuma regra do jogo é alterada.
const controles=new WeakMap();
export function limitarTamanhoHud(w,h,tela,min={w:220,h:160}){
 const maxW=Math.max(48,tela.w-16),maxH=Math.max(48,tela.h-16);
 return {w:Math.max(Math.min(min.w,maxW),Math.min(maxW,Number.isFinite(w)?w:min.w)),h:Math.max(Math.min(min.h,maxH),Math.min(maxH,Number.isFinite(h)?h:min.h))};
}
export function limitarAlturaHud(h,tela,min=160){
 const max=Math.max(48,tela.h-16);
 return Math.max(Math.min(min,max),Math.min(max,Number.isFinite(h)?h:188));
}
export function limitarEscalaHud(valor,base,tela,minimo=.6,passo=0){
 const max=Math.min(2,Math.max(.1,(tela.w-16)/Math.max(1,base.w)),Math.max(.1,(tela.h-16)/Math.max(1,base.h)));
 const min=Math.min(minimo,max),limitado=Math.max(min,Math.min(max,Number.isFinite(valor)?valor:1));
 if(!(passo>0))return limitado;
 const passos=Math.floor((max-min)/passo+1e-9),indice=Math.min(passos,Math.max(0,Math.round((limitado-min)/passo)));
 return Number((min+indice*passo).toFixed(4));
}
export function modoRedimensionamento(painel,eixo='livre'){
 return eixo==='grade'?'grade':eixo==='vertical'?'vertical':painel.tagName==='DIALOG'?'janela':'escala';
}
export function instalarRedimensionamento(painel,chave,{eixo='livre'}={}){
 // Estes painéis preservam tamanho padrão; o arrasto continua independente.
 if(painel.matches('.hud-chat,.hud-tecnicas,.hud-topo,.hud-logo,.hud-pilulas,.hud-dica'))return null;
 if(controles.has(painel))return controles.get(painel);
 const dialogo=painel.tagName==='DIALOG',modo=modoRedimensionamento(painel,eixo),vertical=modo==='vertical',janela=modo==='janela',grade=modo==='grade';
 let salvo=null,arr=null,aplicando=false;
 try{const s=JSON.parse(localStorage.getItem(chave+'-tamanho'));if(s?.modo===modo && (janela?[s.w,s.h].every(n=>Number.isFinite(n)&&n>0):vertical?Number.isFinite(s.h)&&s.h>0:Number.isFinite(s.escala)&&s.escala>0))salvo=s;}catch{}
 const alca=document.createElement(painel.tagName==='BUTTON'?'span':'button');if(alca.tagName==='BUTTON')alca.type='button';else{alca.setAttribute('role','button');alca.tabIndex=0;}alca.className='hud-redimensionar'+(vertical?' hud-redimensionar-vertical':'');alca.textContent=vertical?'↕':'◢';
 const nome=painel.getAttribute('aria-label')||painel.querySelector('h2')?.textContent||'HUD';
 alca.setAttribute('aria-label','Redimensionar '+nome);alca.title=grade?'Arraste para aumentar em passos · duplo clique restaura o tamanho':'Arraste para ajustar o tamanho · setas para ajustar · duplo clique restaura';
 painel.classList.add('hud-ajustavel');painel.append(alca);
 const visivel=()=>painel.getClientRects().length && (!dialogo||painel.open);
 const fixar=(x,y)=>{const r=painel.getBoundingClientRect();Object.assign(painel.style,{position:'fixed',left:Math.max(8,Math.min(x,innerWidth-r.width-8))+'px',top:Math.max(8,Math.min(y,innerHeight-r.height-8))+'px',right:'auto',bottom:'auto',transform:'none'});};
 const aplicar=(valor,ancora=null)=>{
  if(!visivel()||aplicando)return;aplicando=true;
  const r=painel.getBoundingClientRect(),tela={w:innerWidth,h:innerHeight};
  if(janela){const size=limitarTamanhoHud(valor.w,valor.h,tela);painel.classList.add('hud-tamanho-manual');painel.style.setProperty('--hud-largura',size.w+'px');painel.style.setProperty('--hud-altura',size.h+'px');}
  else if(vertical){const largura=painel.getBoundingClientRect().width,altura=limitarAlturaHud(valor.h,tela);painel.classList.add('hud-tamanho-manual');painel.style.setProperty('--hud-largura',largura+'px');painel.style.setProperty('--hud-altura',altura+'px');}
  else{const atual=Number(painel.style.scale)||1;const escala=limitarEscalaHud(valor.escala,{w:r.width/atual,h:r.height/atual},tela,grade?1:.6,grade ? 0.05 : 0);painel.style.transformOrigin='top left';painel.style.scale=String(escala);}
  fixar(ancora?.x??r.left,ancora?.y??r.top);aplicando=false;
 };
 const guardar=()=>{const r=painel.getBoundingClientRect();salvo=janela?{modo,w:r.width,h:r.height}:vertical?{modo,h:r.height}:{modo,escala:Number(painel.style.scale)||1};try{localStorage.setItem(chave+'-tamanho',JSON.stringify(salvo));}catch{}};
 const restaurar=()=>{if(salvo)aplicar(salvo);};
 const reset=()=>{salvo=null;painel.classList.remove('hud-tamanho-manual');painel.style.removeProperty('--hud-largura');painel.style.removeProperty('--hud-altura');painel.style.scale='';try{localStorage.removeItem(chave+'-tamanho');}catch{}};
 alca.addEventListener('pointerdown',e=>{if(e.button!==0||e.isPrimary===false)return;e.preventDefault();e.stopPropagation();const r=painel.getBoundingClientRect();arr={id:e.pointerId,x:e.clientX,y:e.clientY,w:r.width,h:r.height,left:r.left,top:r.top,bottom:r.bottom,escala:Number(painel.style.scale)||1};alca.setPointerCapture(e.pointerId);});
 document.addEventListener('pointermove',e=>{if(!arr||arr.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();const dx=e.clientX-arr.x,dy=e.clientY-arr.y;
  salvo=janela?{modo,w:arr.w+dx,h:arr.h+dy}:vertical?{modo,h:arr.h-dy}:{modo,escala:arr.escala*(1+(dx*arr.w+dy*arr.h)/(arr.w*arr.w+arr.h*arr.h))};
  aplicar(salvo,{x:arr.left,y:vertical?arr.bottom-salvo.h:arr.top});
 },true);
 const fim=e=>{if(!arr||arr.id!==e.pointerId)return;arr=null;if(salvo)guardar();if(alca.hasPointerCapture(e.pointerId))alca.releasePointerCapture(e.pointerId);};
 for(const evento of ['pointerup','pointercancel'])document.addEventListener(evento,fim,true);
 alca.addEventListener('lostpointercapture',fim);
 alca.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();});
 alca.addEventListener('dblclick',e=>{e.preventDefault();e.stopPropagation();reset();});
 alca.addEventListener('keydown',e=>{if(!(vertical?['ArrowUp','ArrowDown','Home']:['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home']).includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key==='Home'){reset();return;}
  const r=painel.getBoundingClientRect(),d=e.shiftKey?40:12;
  salvo=janela?{modo,w:r.width+(e.key==='ArrowRight'?d:e.key==='ArrowLeft'?-d:0),h:r.height+(e.key==='ArrowDown'?d:e.key==='ArrowUp'?-d:0)}:vertical?{modo,h:r.height+(e.key==='ArrowUp'?d:e.key==='ArrowDown'?-d:0)}:{modo,escala:(Number(painel.style.scale)||1)+(['ArrowRight','ArrowDown'].includes(e.key)?.05:-.05)};aplicar(salvo,vertical?{x:r.left,y:r.bottom-salvo.h}:null);guardar();
 });
 // Conteúdo de janelas permanece rolável ao diminuir. Reabrir restaura o tamanho salvo.
 if(dialogo)new MutationObserver(()=>{if(painel.open)requestAnimationFrame(restaurar);}).observe(painel,{attributes:true,attributeFilter:['open']});
 else new MutationObserver(()=>{if(visivel())requestAnimationFrame(restaurar);}).observe(painel,{attributes:true,attributeFilter:['hidden','class']});
 if(!dialogo)new ResizeObserver(()=>{if(salvo)requestAnimationFrame(restaurar);}).observe(painel);
 addEventListener('resize',()=>requestAnimationFrame(restaurar));
 const controle={restaurar,reset};controles.set(painel,controle);requestAnimationFrame(restaurar);return controle;
}
