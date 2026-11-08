import {ATALHOS,atalhoDeInterface,alvoEditavel,teclasDoAtalho} from '../shared/atalhos.mjs';
export function instalarAtalhosInterface({ativo,bloqueado,abrirMenu,caca,painelCaca,montaria,soltarTeclas}){
 const consumir=e=>{e.preventDefault();e.stopImmediatePropagation();};
 const onKey=e=>{
  if(e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||e.isComposing||!ativo()||bloqueado())return;
  const key=e.key.toLowerCase();
  if(key==='escape'){
   consumir(e);if(e.repeat)return;
   const abertas=[...document.querySelectorAll('dialog[open]:not(#welcomeDialog):not(#tutorialDialog)')];
   if(abertas.length){abertas.at(-1).close();soltarTeclas();return;}
   if(alvoEditavel(e.target)){e.target.blur?.();soltarTeclas();return;}
   abrirMenu('ajustes');soltarTeclas();return;
  }
  const a=atalhoDeInterface(e);if(!a){if(e.repeat&&!alvoEditavel(e.target)&&ATALHOS.some(a=>(a.menu||a.comando)&&a.teclas.includes(key)))consumir(e);return;}
  // Enter continua acessível para ativar botões/links e abrir os controles nativos.
  if(a.comando==='chat'&&e.target.closest?.('button,a,summary,[role="button"]'))return;
  consumir(e);
  if(a.menu){soltarTeclas();abrirMenu(a.menu);}
  else if(a.comando==='caca')caca();
  else if(a.comando==='painelCaca'){soltarTeclas();painelCaca();}
  else if(a.comando==='montaria')montaria();
  else if(a.comando==='chat'){soltarTeclas();document.getElementById('chatInput')?.focus();}
 };
 window.addEventListener('keydown',onKey,true);
 for(const a of ATALHOS.filter(a=>a.menu))for(const b of document.querySelectorAll('[data-menu="'+a.menu+'"]')){
  b.title=(b.title||a.nome)+' · '+teclasDoAtalho(a);b.setAttribute('aria-keyshortcuts',a.teclas[0]==='escape'?'Escape':a.teclas[0]==='tab'?'Tab':a.teclas[0].toUpperCase());
 }
 return()=>window.removeEventListener('keydown',onKey,true);
}
