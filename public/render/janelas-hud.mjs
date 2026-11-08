import {instalarArrasto} from './painel-movel.mjs';
const controles=new WeakMap();let instalado=false;
export function fecharOutrasJanelas(atual){
 for(const janela of document.querySelectorAll('dialog[open]'))if(janela!==atual&&janela.id!=='welcomeDialog')janela.close();
}
export function instalarJanelasHud(){
 if(instalado)return;instalado=true;
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const aberta=document.querySelector('dialog[open]:not(#welcomeDialog):not(#tutorialDialog)');if(aberta){aberta.close();e.preventDefault();e.stopPropagation();}},true);
 const preparar=janela=>{
  if(controles.has(janela)||janela.id==='welcomeDialog')return;
  let cabecalho=janela.querySelector('header,.worlds-head,.mochila-topo,.auto-hunt-head');
  if(janela.id==='shopDialog'){
   const titulo=janela.querySelector('h2'),fechar=janela.querySelector('.close-dialog');
   cabecalho=document.createElement('header');cabecalho.className='janela-loja-cabecalho';titulo.before(cabecalho);cabecalho.append(titulo,fechar);
  }
  if(!cabecalho)return;
  cabecalho.classList.add('janela-arrastavel');cabecalho.title='Arraste para mover · duplo clique para restaurar a posição';
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