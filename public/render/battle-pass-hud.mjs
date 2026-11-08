import {el,botao,numero,barra} from './hud-elementos.mjs';
import {criarPainelPremium,textoRecompensa} from './premium-comum.mjs';
import {COLECIONAVEIS} from '../shared/premium-config.mjs';
const imagens={ki:'pocao_ki',food:'comida',crystal:'cristal',scrap:'sucata',seed15:'semente_dos_deuses'};
function imagemRecompensa(r){return r.colecao?.length?COLECIONAVEIS[r.colecao[0]].imagem:r.bau?'/assets/premium/caixa-espolios.png':r.moedas?'/assets/hud/personagem/zeni.png':r.zeni?'/assets/hud/personagem/zeni.png':'/assets/inventario/'+imagens[Object.keys(r.itens||{})[0]]+'.png';}
function icone(r){const img=el('img',null,'passe-icone');img.src=imagemRecompensa(r);img.alt=textoRecompensa(r);img.draggable=false;return img;}
export function instalarBattlePass(ctx){
 const ui=criarPainelPremium('battlePassDialog','Passe de Batalha',ctx);let aba='trilhas',scroll=0,anterior=null,previa=null,assinatura='';
 for(const [id,nome]of [['trilhas','Recompensas'],['missoes','Missões do Passe']]){const b=botao(nome,()=>{aba=id;if(ui.estado)desenhar(ui.estado);});b.dataset.passeAba=id;ui.nav.append(b);}
 function mostrarPrevia(r,trilha,nivel){
  previa?.remove();previa=el('section',null,'passe-previa');previa.setAttribute('role','region');previa.setAttribute('aria-label','Prévia da recompensa');
  previa.append(icone(r),el('h3',trilha+' · nível '+nivel),el('p',textoRecompensa(r)));
  if(r.bau)previa.append(el('small','Baú de conteúdo fixo. Todos os recursos descritos são entregues diretamente à mochila no resgate.'));
  if(r.colecao)previa.append(el('small','Colecionável da conta. Arte ilustrativa: equipar e exibir os cosméticos no personagem ainda será disponibilizado. Sem bônus de combate.'));
  previa.append(botao('Fechar prévia',()=>{previa.remove();previa=null;}));ui.corpo.prepend(previa);
 }
 function desenhar(s){
  const chave=JSON.stringify([Math.floor(Date.now()/3600000),aba,s.battlePass,s.saldo,s.produtos.map(x=>x.impedimento)]);if(chave===assinatura&&ui.corpo.childElementCount)return;assinatura=chave;
  const p=s.battlePass,velho=ui.corpo.querySelector('.passe-trilhas');if(velho)scroll=velho.scrollLeft;
  for(const b of ui.nav.children)b.setAttribute('aria-pressed',String(b.dataset.passeAba===aba));
  const subiu=anterior?.id===p.temporada.id&&p.nivel>anterior.nivel,ganhou=anterior?.id===p.temporada.id&&p.xp>anterior.xp;
  ui.corpo.replaceChildren();previa=null;
  const restante=Math.max(0,Date.parse(p.temporada.fim)-Date.now()),horas=Math.ceil(restante/3600000);
  const resumo=el('div',null,'passe-resumo');ui.corpo.append(resumo);
  resumo.append(el('h3',p.temporada.nome),el('p',p.ativa?'Termina em '+Math.floor(horas/24)+'d '+horas%24+'h · '+new Date(p.temporada.fim).toLocaleString('pt-BR'):'Temporada encerrada ou ainda não iniciada.'),el('strong','Nível '+p.nivel+' / '+p.temporada.niveis+' · '+numero(p.xp)+' XP do Passe'));
  const progresso=barra(p.xpNoNivel,p.temporada.xpPorNivel);progresso.setAttribute('aria-label','XP do Passe');if(ganhou){progresso.classList.add('passe-xp-ganho');progresso.value=anterior.nivel===p.nivel?anterior.xp%p.temporada.xpPorNivel:0;requestAnimationFrame(()=>{if(progresso.isConnected)progresso.value=p.xpNoNivel;});}resumo.append(progresso,el('p',p.nivel===p.temporada.niveis?'Nível máximo. XP adicional desativado nesta temporada.':numero(p.xpNoNivel)+' / '+numero(p.temporada.xpPorNivel)+' XP para o próximo nível.'));
  if(subiu)resumo.append(el('strong','Novo nível do Passe: '+p.nivel+'!','passe-subiu'));
  anterior={id:p.temporada.id,xp:p.xp,nivel:p.nivel};
  const comprar=botao(p.premium?'Premium ativo na conta':'Adquirir Premium · '+p.temporada.precoPremium+' moedas',()=>ui.comprar('passe-'+p.temporada.id));
  comprar.dataset.produto='passe-'+p.temporada.id;const oferta=s.produtos.find(x=>x.temporada===p.temporada.id);comprar.disabled=p.premium||!p.ativa||Boolean(oferta?.impedimento);resumo.append(comprar);
  if(!p.premium&&oferta?.impedimento)resumo.append(el('small',oferta.impedimento));
  resumo.append(el('p','Passe compartilhado na conta · Premium válido nesta temporada · Resgates retroativos individuais.','premium-nota'));
  if(aba==='missoes'){
   for(const categoria of ['diaria','semanal']){ui.corpo.append(el('h3',categoria==='diaria'?'Missões diárias · UTC':'Missões semanais · segunda-feira UTC'));
    for(const m of p.missoes.filter(m=>m.categoria===categoria)){
     const card=el('article',null,'premium-missao'),resgatar=botao(m.resgatada?'XP recebido':'Receber '+m.xp+' XP',()=>ui.executar({operacao:'resgatarMissao',id:m.id}));resgatar.disabled=!p.ativa||m.resgatada||m.progresso<m.meta;resgatar.dataset.missaoPasse=m.id;
     card.append(el('strong',m.nome),el('p',numero(m.progresso)+' / '+numero(m.meta)),barra(m.progresso,m.meta),el('small','Renova em '+new Date(m.renovaEm).toLocaleString('pt-BR')),resgatar);ui.corpo.append(card);
    }
   }return;
  }
  const ajuda=el('div',null,'passe-navegacao'),trilhas=el('div',null,'passe-trilhas');trilhas.tabIndex=0;trilhas.setAttribute('aria-label','Recompensas: Premium acima, Grátis abaixo. Arraste ou role horizontalmente.');
  ajuda.append(botao('←',()=>trilhas.scrollBy({left:-360,behavior:'smooth'})),el('span','Premium acima · Grátis abaixo · arraste para explorar'),botao('→',()=>trilhas.scrollBy({left:360,behavior:'smooth'})));ui.corpo.append(ajuda,trilhas);
  for(const n of p.niveis){const row=el('article',null,'passe-nivel'+(n.nivel===Math.max(1,p.nivel)?' passe-atual':''));row.dataset.nivelPasse=n.nivel;row.append(el('h4','Nível '+n.nivel));
   for(const trilha of ['premium','gratis']){const r=n[trilha],card=el('section',null,'passe-recompensa '+trilha+(r.desbloqueada&&!r.resgatada?' disponivel':'')+(r.resgatada?' recebida':''));
    const ver=botao('',()=>mostrarPrevia(r.recompensa,trilha==='premium'?'Premium':'Grátis',n.nivel));ver.className='passe-ver';ver.setAttribute('aria-label','Ver '+textoRecompensa(r.recompensa));ver.append(icone(r.recompensa));
    const resgatar=botao(r.resgatada?'✓ Resgatada':r.desbloqueada?'Resgatar':'🔒 Bloqueada',async()=>{await ui.executar({operacao:'resgatarRecompensa',nivel:n.nivel,trilha});if(trilha==='premium'&&ui.estado?.battlePass.niveis[n.nivel-1]?.premium.resgatada){ui.corpo.classList.remove('passe-resgate-dourado');void ui.corpo.offsetWidth;ui.corpo.classList.add('passe-resgate-dourado');}});
    resgatar.dataset.resgate=trilha+':'+n.nivel;resgatar.disabled=r.resgatada||!r.desbloqueada;
    card.append(el('strong',trilha==='premium'?'Premium':'Grátis'),ver,el('p',textoRecompensa(r.recompensa)),resgatar);row.append(card);
   }trilhas.append(row);
  }
  trilhas.scrollLeft=scroll;
  trilhas.addEventListener('wheel',e=>{if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;const antes=trilhas.scrollLeft;trilhas.scrollLeft+=e.deltaY;if(antes!==trilhas.scrollLeft)e.preventDefault();},{passive:false});
  let drag=null,arrastou=false;
  trilhas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;drag={x:e.clientX,scroll:trilhas.scrollLeft,id:e.pointerId};arrastou=false;});
  trilhas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>6){arrastou=true;trilhas.setPointerCapture(e.pointerId);trilhas.scrollLeft=drag.scroll-dx;}});
  const parar=()=>{drag=null;};trilhas.addEventListener('pointerup',parar);trilhas.addEventListener('pointercancel',parar);
  trilhas.addEventListener('click',e=>{if(arrastou){e.preventDefault();e.stopImmediatePropagation();arrastou=false;}},true);
  trilhas.addEventListener('keydown',e=>{if(e.target!==trilhas)return;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();trilhas.scrollBy({left:e.key==='ArrowLeft'?-190:190,behavior:'smooth'});}});
 }
 ui.setRender(desenhar);return ui.abrir;
}
