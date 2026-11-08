import {el,botao,numero,barra} from './hud-elementos.mjs';
import {criarPainelPremium,textoRecompensa} from './premium-comum.mjs';
export function instalarBattlePass(ctx){
 const ui=criarPainelPremium('battlePassDialog','Battle Pass',ctx);let aba='trilhas';
 for(const [id,nome]of [['trilhas','Recompensas'],['missoes','Missões diárias e semanais']]){const b=botao(nome,()=>{aba=id;if(ui.estado)desenhar(ui.estado);});b.dataset.passeAba=id;ui.nav.append(b);}
 function desenhar(s){
  const p=s.battlePass;for(const b of ui.nav.children)b.setAttribute('aria-pressed',String(b.dataset.passeAba===aba));ui.corpo.replaceChildren();
  ui.corpo.append(el('h3',p.temporada.nome),el('p',new Date(p.temporada.inicio).toLocaleDateString('pt-BR')+' — '+new Date(p.temporada.fim).toLocaleDateString('pt-BR')+(p.ativa?' · Temporada ativa':' · Fora do período da temporada')),el('strong','Nível '+p.nivel+' / '+p.temporada.niveis+' · '+numero(p.xp)+' BP XP'),barra(p.xpNoNivel,p.temporada.xpPorNivel),el('p',p.nivel===p.temporada.niveis?'Nível máximo alcançado.':p.xpNoNivel+' / '+p.temporada.xpPorNivel+' BP XP para o próximo nível.'));
  const comprar=botao(p.premium?'Premium ativo neste personagem':'Adquirir Premium · '+p.temporada.precoPremium+' moedas',()=>ui.comprar('passe-'+p.temporada.id));
  comprar.dataset.produto='passe-'+p.temporada.id;const oferta=s.produtos.find(x=>x.temporada===p.temporada.id);comprar.disabled=p.premium||!p.ativa||Boolean(oferta?.impedimento);ui.corpo.append(comprar);
  if(!p.premium&&oferta?.impedimento)ui.corpo.append(el('small',oferta.impedimento));
  ui.corpo.append(el('p','Progresso individual deste personagem. Moedas premium e colecionáveis são compartilhados na conta. O passe adquirido depois libera as recompensas dos níveis já conquistados.','premium-nota'));
  if(aba==='missoes'){
   for(const categoria of ['diaria','semanal']){ui.corpo.append(el('h3',categoria==='diaria'?'Missões diárias · UTC':'Missões semanais · segunda-feira UTC'));
    for(const m of p.missoes.filter(m=>m.categoria===categoria)){
     const card=el('article',null,'premium-missao'),resgatar=botao(m.resgatada?'BP XP recebido':'Receber '+m.xp+' BP XP',()=>ui.executar({operacao:'resgatarMissao',id:m.id}));resgatar.disabled=!p.ativa||m.resgatada||m.progresso<m.meta;resgatar.dataset.missaoPasse=m.id;
     card.append(el('strong',m.nome),el('p',m.progresso+' / '+m.meta),barra(m.progresso,m.meta),el('small','Renova em '+new Date(m.renovaEm).toLocaleString('pt-BR')),resgatar);ui.corpo.append(card);
    }
   }return;
  }
  const trilhas=el('div',null,'passe-trilhas');ui.corpo.append(trilhas);
  for(const n of p.niveis){const row=el('article',null,'passe-nivel');row.dataset.nivelPasse=n.nivel;row.append(el('h4','Nível '+n.nivel));
   for(const trilha of ['gratis','premium']){const r=n[trilha],card=el('section',null,'passe-recompensa '+trilha),resgatar=botao(r.resgatada?'Recebida':r.desbloqueada?'Resgatar':'Bloqueada',()=>ui.executar({operacao:'resgatarRecompensa',nivel:n.nivel,trilha}));resgatar.dataset.resgate=trilha+':'+n.nivel;resgatar.disabled=r.resgatada||!r.desbloqueada;
    card.append(el('strong',trilha==='gratis'?'Grátis':'Premium'),el('p',textoRecompensa(r.recompensa)),resgatar);row.append(card);
   }trilhas.append(row);
  }
 }
 ui.setRender(desenhar);return ui.abrir;
}
