import {tradutor} from './i18n.mjs';
import {areaPorId} from '../shared/config.mjs';
import {preferenciasValidas} from '../shared/preferencias.mjs';
let instancia=null;
export const consultarEstadoAudio=()=>instancia?.estado()||null;
export const testarMusica=()=>instancia?.testar();
export const TRILHAS=Object.freeze({login:'/assets/audio/login.mp3',cidades:'/assets/audio/cidades.mp3',hunts:'/assets/audio/hunts.mp3'});
export function ambienteMusical(snapshot,loginAberto=false){
 if(loginAberto)return 'login';
 const p=snapshot?.self;if(!p)return null;
 if(p.planet==='terra')return 'cidades';
 const area=areaPorId(p.area);return area?area.segura?'cidades':'hunts':null;
}

// Nunca fixa um ID de fone/alto-falante. A string vazia é a saída padrão do navegador.
export function seguirSaidaPadrao({audio,dispositivos=globalThis.navigator?.mediaDevices}){
 let encerrado=false,pendente=null;
 const sincronizar=()=>{
  if(encerrado||typeof audio.setSinkId!=='function')return Promise.resolve(false);
  if(pendente)return pendente;
  try{pendente=Promise.resolve(audio.setSinkId('')).then(()=>true,()=>false).finally(()=>{pendente=null;});}
  catch{pendente=null;return Promise.resolve(false);}
  return pendente;
 };
 const mudou=()=>{sincronizar();};dispositivos?.addEventListener?.('devicechange',mudou);sincronizar();
 return{sincronizar,destruir(){encerrado=true;dispositivos?.removeEventListener?.('devicechange',mudou);}};
}

// Um elemento por cliente. Snapshots repetidos nunca reiniciam a faixa.
export function criarTrilhaSonora({audio,aoEstado=()=>{},antesDeTocar=()=>{}}){
 audio.loop=true;audio.preload='none';
 let ambiente=null,preferencias=preferenciasValidas(),versao=0,pendente=false,bloqueado=false,erro=false,destruido=false,suspenso=false;
 const estado=()=>({ambiente,ativa:preferencias.musicaAtiva,volume:preferencias.volumeMusica,bloqueado,erro,carregando:pendente,pausado:audio.paused,pronto:audio.readyState??0,tempo:audio.currentTime||0,codigoErro:audio.error?.code||null});
 const avisar=()=>aoEstado(estado());
 const parar=()=>{versao++;pendente=false;audio.pause();try{audio.currentTime=0;}catch{};};
 const reproduzir=()=>{
  if(destruido||suspenso||!ambiente||!preferencias.musicaAtiva||preferencias.volumeMusica===0||pendente||!audio.paused)return;
  const rodada=versao;pendente=true;antesDeTocar();
  let promessa;try{promessa=audio.play();}catch(e){promessa=Promise.reject(e);}
  Promise.resolve(promessa).then(()=>{if(rodada!==versao||destruido)return;pendente=false;bloqueado=false;erro=false;avisar();}).catch(e=>{
   if(rodada!==versao||destruido)return;pendente=false;
   bloqueado=e?.name==='NotAllowedError';erro=!bloqueado&&e?.name!=='AbortError';avisar();
  });
 };
 const aoErro=()=>{if(destruido)return;erro=true;pendente=false;avisar();};audio.addEventListener('error',aoErro);
 return{
  atualizar(snapshot,loginAberto=false,valor=preferencias){
   if(destruido)return;const anterior=preferencias;preferencias=preferenciasValidas(valor);audio.volume=preferencias.volumeMusica;
   const destino=ambienteMusical(snapshot,loginAberto),mudou=destino!==ambiente;
   if(mudou){parar();ambiente=destino;bloqueado=false;erro=false;if(destino)audio.src=TRILHAS[destino];else{audio.removeAttribute('src');audio.load();}}
   if(!preferencias.musicaAtiva||preferencias.volumeMusica===0){if(!audio.paused||pendente)parar();bloqueado=false;}
   else if(mudou||!anterior.musicaAtiva||anterior.volumeMusica===0)reproduzir();
   avisar();
  },
  estado,
  desbloquear(){if(!destruido&&!erro)reproduzir();},
  testar(){if(destruido||!ambiente||!preferencias.musicaAtiva||preferencias.volumeMusica===0)return false;parar();erro=false;bloqueado=false;audio.src=TRILHAS[ambiente];audio.load();reproduzir();avisar();return true;},
  suspender(){suspenso=true;parar();},
  retomar(){suspenso=false;reproduzir();},
  destruir(){destruido=true;parar();audio.removeEventListener('error',aoErro);audio.removeAttribute('src');audio.load();}
 };
}
export function instalarTrilhaSonora({obterEstado,documento=document,armazenamento=globalThis.localStorage}){
 const audio=documento.createElement('audio');audio.id='trilhaSonora';audio.hidden=true;audio.setAttribute('aria-hidden','true');documento.body.append(audio);
 const saida=seguirSaidaPadrao({audio});
 const login=documento.getElementById('welcomeDialog'),dica=documento.createElement('p');dica.className='hud-nota';dica.hidden=true;dica.setAttribute('role','status');login?.append(dica);
 let cache=preferenciasValidas(),assinatura='';try{cache=preferenciasValidas(JSON.parse(armazenamento?.getItem('dbi-audio-preferencias')||'{}'));}catch{}
 const player=criarTrilhaSonora({audio,antesDeTocar:()=>saida.sincronizar(),aoEstado:s=>{dica.hidden=!login?.open||!s.ativa||!s.volume||(!s.bloqueado&&!s.erro);dica.textContent=tradutor(documento.documentElement.lang)(s.erro?'audioFalha':'audioBloqueado');}});
 const atualizar=()=>{const snapshot=obterEstado();if(snapshot?.self?.preferencias){const p=snapshot.self.preferencias,sig=JSON.stringify([p.musicaAtiva,p.volumeMusica]);cache=preferenciasValidas(p);if(sig!==assinatura){assinatura=sig;try{armazenamento?.setItem('dbi-audio-preferencias',JSON.stringify({musicaAtiva:cache.musicaAtiva,volumeMusica:cache.volumeMusica}));}catch{}}}player.atualizar(snapshot,Boolean(login?.open),cache);};
 instancia=player;
 const interagir=e=>{if(!e.isTrusted)return;if(player.estado().erro)player.testar();else player.desbloquear();};documento.addEventListener('pointerdown',interagir,true);documento.addEventListener('pointerup',interagir,true);documento.addEventListener('click',interagir,true);documento.addEventListener('keydown',interagir,true);
 const observer=new MutationObserver(atualizar);if(login)observer.observe(login,{attributes:true,attributeFilter:['open']});
 const aoSair=()=>player.suspender(),aoVoltar=()=>{atualizar();player.retomar();};globalThis.addEventListener('focus',saida.sincronizar);globalThis.addEventListener('pagehide',aoSair);globalThis.addEventListener('pageshow',aoVoltar);atualizar();
 return{atualizar,get preferencias(){return cache;},configurar(valor){cache=preferenciasValidas(valor);try{armazenamento?.setItem('dbi-audio-preferencias',JSON.stringify({musicaAtiva:cache.musicaAtiva,volumeMusica:cache.volumeMusica}));}catch{}player.atualizar(obterEstado(),Boolean(login?.open),cache);},destruir(){observer.disconnect();documento.removeEventListener('pointerdown',interagir,true);documento.removeEventListener('pointerup',interagir,true);documento.removeEventListener('click',interagir,true);documento.removeEventListener('keydown',interagir,true);globalThis.removeEventListener('focus',saida.sincronizar);saida.destruir();globalThis.removeEventListener('pagehide',aoSair);globalThis.removeEventListener('pageshow',aoVoltar);player.destruir();if(instancia===player)instancia=null;audio.remove();dica.remove();}};
}