import {instalarRedimensionamento} from './redimensionar-hud.mjs';
import {instalarArrasto} from './painel-movel.mjs';
const controles=new WeakMap();let instalado=false;
export function fecharOutrasJanelas(atual){
 // A mochila é um painel persistente: abrir outra janela não deve fechá-la. Ao abrir a
 // mochila, também preserva a janela que já estava aberta para permitir consultar as duas.
 if(atual?.id==='mochilaDialog')return;
 for(const janela of document.querySelectorAll('dialog[open]'))if(janela!==atual&&janela.id!=='welcomeDialog'&&janela.id!=='mochilaDialog')janela.close();
}
export function instalarJanelasHud(){
 if(instalado)return;instalado=true;
 document.addEventListener('keydown',e=>{if(e.key!=='Escape'||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||e.isComposing)return;const abertas=[...document.querySelectorAll('dialog[open]:not(#welcomeDialog):not(#tutorialDialog)')],aberta=abertas.find(j=>j.id!=='mochilaDialog');if(aberta){aberta.close();e.preventDefault();e.stopImmediatePropagation();}else if(abertas.length){e.preventDefault();e.stopImmediatePropagation();}},true);
 const preparar=janela=>{
  if(controles.has(janela)||janela.id==='welcomeDialog')return;
  let cabecalho=janela.querySelector('header,.worlds-head,.mochila-topo,.auto-hunt-head');
  if(janela.id==='shopDialog'){
   const titulo=janela.querySelector('h2'),fechar=janela.querySelector('.close-dialog');
   cabecalho=document.createElement('header');cabecalho.className='janela-loja-cabecalho';titulo.before(cabecalho);cabecalho.append(titulo,fechar);
  }
  if(!cabecalho)return;
  if(janela.id!=='tutorialDialog'){
   const eixo=janela.id==='mochilaDialog'?'grade':'livre';
   instalarRedimensionamento(janela,'dbi-janela-'+(janela.id||janela.className.split(' ')[0]),{eixo});
  }
  cabecalho.classList.add('janela-arrastavel');cabecalho.title='Arraste para mover · duplo clique para restaurar a posição';
  const chaveTrava='dbi-janela-'+(janela.id||janela.className.split(' ')[0])+'-travada';
  const cadeado=document.createElement('button');cadeado.type='button';cadeado.className='hud-cadeado';
  if(janela.id==='mochilaDialog')cadeado.classList.add('mochila-x');
  const iconeCadeado=document.createElement('img');iconeCadeado.alt='';iconeCadeado.draggable=false;cadeado.append(iconeCadeado);
  const travar=valor=>{
   janela.classList.toggle('hud-posicao-travada',valor);
   iconeCadeado.src=valor?'/assets/hud/cadeado-fechado.png':'/assets/hud/cadeado-aberto.png';cadeado.setAttribute('aria-pressed',String(valor));
   cadeado.title=valor?'Destravar posição da janela':'Travar posição da janela';cadeado.setAttribute('aria-label',cadeado.title);
  };
  let travada=false;try{travada=localStorage.getItem(chaveTrava)==='true';}catch{}travar(travada);
  cadeado.onclick=()=>{travada=!travada;travar(travada);try{localStorage.setItem(chaveTrava,String(travada));}catch{}};
  const acoes=document.createElement('div');acoes.className='janela-acoes';
  const botoes=[...cabecalho.querySelectorAll('button')];
  acoes.append(cadeado,...botoes);cabecalho.append(acoes);
  // Auto Hunt já possui seu controlador de arrasto e altura próprios.
  if(janela.id==='autoHuntDialog'){controles.set(janela,null);return;}
  const controle=instalarArrasto(janela,cabecalho,'dbi-janela-'+(janela.id||janela.className.split(' ')[0]));controles.set(janela,controle);
  new ResizeObserver(()=>{if(janela.open)controle.restaurar();}).observe(janela);
 };
 const aoAbrir=janela=>{preparar(janela);fecharOutrasJanelas(janela);requestAnimationFrame(()=>{if(janela.open)controles.get(janela)?.restaurar();});};
 for(const janela of document.querySelectorAll('dialog'))preparar(janela);
 document.addEventListener('beforetoggle',e=>{if(e.target.tagName==='DIALOG'&&e.newState==='open'&&e.target.id!=='welcomeDialog'){preparar(e.target);fecharOutrasJanelas(e.target);}},true);
 const observer=new MutationObserver(mudancas=>{
  for(const m of mudancas)if(m.type==='attributes'&&m.target.tagName==='DIALOG'&&m.target.open&&m.target.id!=='welcomeDialog')aoAbrir(m.target);
  for(const m of mudancas)if(m.type==='childList')for(const n of m.addedNodes)if(n.nodeType===1){if(n.tagName==='DIALOG')preparar(n);for(const d of n.querySelectorAll?.('dialog')||[])preparar(d);}
 });observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
}
