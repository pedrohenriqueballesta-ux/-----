import {fecharOutrasJanelas} from './janelas-hud.mjs';
import {el} from './hud-elementos.mjs';
import {montarPerfil} from './perfil-hud.mjs';
import {montarConfiguracoes} from './configuracoes-hud.mjs';
import {montarMissoes} from './missoes-hud.mjs';
import {montarCorreio} from './correio-hud.mjs';
import {montarRanking} from './ranking-hud.mjs';
import {montarGuildas} from './guildas-hud.mjs';
const nomes={personagem:'Personagem',ajustes:'Configurações',missoes:'Missões',correio:'Mensagens e novidades',ranking:'Ranking',guilda:'Guildas'};
export function instalarAbasHud(ctx,{autoHunt,avisar}){
 const janela=el('dialog',null,'hud-funcional'),cabecalho=el('header'),titulo=el('h2'),fechar=el('button','×'),status=el('p','','hud-status'),corpo=el('div',null,'hud-funcional-corpo'),rastreio=el('aside',null,'hud-missao');
 rastreio.append(el('span',null,'hud-missao-texto'));
 janela.id='hudFuncionalDialog';janela.setAttribute('aria-labelledby','hudFuncionalTitulo');titulo.id='hudFuncionalTitulo';fechar.type='button';fechar.setAttribute('aria-label','Fechar janela');cabecalho.append(titulo,fechar);janela.append(cabecalho,status,corpo);document.body.append(janela,rastreio);
 let aba=null,atualizador=null,modulo=null,ultimaPreferencia='',origem=null;
 const executar=async dados=>{try{const r=await ctx.api('action',dados);status.textContent=r.ok?'Alteração salva.':r.reason||'Não foi possível concluir.';return r;}catch(e){status.textContent=e.message;return{ok:false,reason:e.message};}};
 const opcoes={sairConta:ctx.sairConta,selecionarPersonagem:ctx.selecionarPersonagem,reverTutorial:ctx.reverTutorial,acao:executar,api:ctx.api,consultar:d=>ctx.api('hud',d),avisar,autoHunt:()=>{janela.close();autoHunt();},abrirGuilda:()=>abrir('guilda')};
 const limpar=()=>{modulo?.fechar?.();modulo=null;atualizador=null;};
 janela.addEventListener('close',()=>{if(janela.open)return;limpar();ctx.soltarTeclas();origem?.focus({preventScroll:true});});fechar.onclick=()=>janela.close();
 janela.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();janela.close();}e.stopPropagation();});
 const abrir=nome=>{
  if(!Object.hasOwn(nomes,nome))return false;
  if(!ctx.snapshot()?.self){avisar('Aguarde a conexão com o servidor.');return true;}
  if(janela.open&&aba===nome){janela.close();return true;}
  fecharOutrasJanelas(janela);limpar();aba=nome;status.textContent='';titulo.textContent=nomes[nome];corpo.replaceChildren();origem=document.querySelector('[data-menu="'+nome+'"]');
  const fabrica={personagem:montarPerfil,ajustes:montarConfiguracoes,missoes:montarMissoes,correio:montarCorreio,ranking:montarRanking,guilda:montarGuildas}[nome];
  const r=fabrica(corpo,opcoes);if(typeof r==='function')atualizador=r;else{modulo=r;atualizador=s=>r.atualizar(s);}
  // As novas telas seguem o modelo não modal da Mochila: o mundo continua simulando.
  ctx.soltarTeclas();if(!janela.open)janela.show();atualizador(ctx.snapshot());fechar.focus({preventScroll:true});return true;
 };
 const atualizar=s=>{
  if(!s?.self)return;const p=s.self.preferencias,sig=JSON.stringify(p);
  if(sig!==ultimaPreferencia){ultimaPreferencia=sig;const root=document.documentElement;root.style.setProperty('--hud-escala',p.escalaHud);root.style.setProperty('--hud-opacidade',p.opacidade);root.classList.toggle('hud-reduzir-animacoes',p.reduzirAnimacoes);root.classList.toggle('hud-sem-extras',!p.informacoesExtras);root.dataset.avisos=String(p.notificacoes);dispatchEvent(new Event('resize'));}
  const m=s.self.missoes.find(m=>m.acompanhada);rastreio.hidden=!m;rastreio.querySelector('.hud-missao-texto').textContent=m?'◎ '+m.nome+' · '+m.progresso+' / '+m.meta:'';
  if(janela.open)atualizador?.(s);
 };
 return{abrir,atualizar};
}